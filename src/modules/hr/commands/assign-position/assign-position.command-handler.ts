import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { EmployeeNotFoundError, InvalidPositionKeyError } from "../../domain/employee.errors.js";
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
        const positionExists = await this.positionRepo.existsByKey(cmd.positionKey);
        if (!positionExists) {
            throw new InvalidPositionKeyError(cmd.positionKey);
        }

        const employee = await this.employeeRepo.findOneById(cmd.employeeId);
        if (!employee) {
            throw new EmployeeNotFoundError(cmd.employeeId);
        }

        employee.assignPosition(cmd.positionKey);

        await this.employeeRepo.save(employee);
        await this.uow.commit();

        for (const event of employee.domainEvents) {
            await this.eventBus.publish(event);
        }
        employee.clearEvents();
    }
}
