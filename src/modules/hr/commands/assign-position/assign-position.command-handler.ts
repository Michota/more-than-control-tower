import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { QualificationValueType } from "../../../../shared/positions/position.types.js";
import { EmployeeNotFoundError } from "../../domain/employee.errors.js";
import { QualificationAttribute } from "../../domain/qualification-attribute.value-object.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { AssignPositionCommand } from "./assign-position.command.js";

@CommandHandler(AssignPositionCommand)
export class AssignPositionCommandHandler implements ICommandHandler<AssignPositionCommand> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: AssignPositionCommand): Promise<void> {
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
}
