import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { QualificationValueType } from "../../../../shared/positions/position.types.js";
import {
    EmployeeNotFoundError,
    InvalidPositionKeyError,
    InvalidQualificationError,
} from "../../domain/employee.errors.js";
import { QualificationAttribute } from "../../domain/qualification-attribute.value-object.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import type { PositionRepositoryPort } from "../../database/position.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT, POSITION_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { AssignPositionCommand } from "./assign-position.command.js";

@CommandHandler(AssignPositionCommand)
export class AssignPositionCommandHandler implements ICommandHandler<AssignPositionCommand> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(POSITION_REPOSITORY_PORT)
        private readonly positionRepo: PositionRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: AssignPositionCommand): Promise<void> {
        const position = await this.positionRepo.findByKey(cmd.positionKey);
        if (!position) {
            throw new InvalidPositionKeyError(cmd.positionKey);
        }

        this.validateQualifications(cmd, position.qualificationSchema);

        const employee = await this.employeeRepo.findOneById(cmd.employeeId);
        if (!employee) {
            throw new EmployeeNotFoundError(cmd.employeeId);
        }

        const qualifications = cmd.qualifications.map(
            (q) =>
                new QualificationAttribute({
                    key: q.key,
                    type: q.type as QualificationValueType,
                    value: q.value,
                }),
        );

        employee.assignPosition(cmd.positionKey, qualifications);

        await this.employeeRepo.save(employee);
        await this.uow.commit();

        for (const event of employee.domainEvents) {
            await this.eventBus.publish(event);
        }
        employee.clearEvents();
    }

    private validateQualifications(
        cmd: AssignPositionCommand,
        schema: { key: string; type: string; required?: boolean }[],
    ): void {
        const providedKeys = new Set(cmd.qualifications.map((q) => q.key));

        for (const entry of schema) {
            if (entry.required && !providedKeys.has(entry.key)) {
                throw new InvalidQualificationError(
                    `Required qualification "${entry.key}" is missing for position "${cmd.positionKey}"`,
                );
            }
        }

        const validKeys = new Set(schema.map((s) => s.key));
        for (const qual of cmd.qualifications) {
            if (!validKeys.has(qual.key)) {
                throw new InvalidQualificationError(
                    `Qualification "${qual.key}" is not defined for position "${cmd.positionKey}"`,
                );
            }

            const schemaDef = schema.find((s) => s.key === qual.key);
            if (schemaDef && qual.type !== schemaDef.type) {
                throw new InvalidQualificationError(
                    `Qualification "${qual.key}" must be of type "${schemaDef.type}", got "${qual.type}"`,
                );
            }
        }
    }
}
