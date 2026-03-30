import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";
import { EmployeeNotFoundError, UserNotFoundError } from "../../domain/employee.errors.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { LinkEmployeeToUserCommand } from "./link-employee-to-user.command.js";

@CommandHandler(LinkEmployeeToUserCommand)
export class LinkEmployeeToUserCommandHandler implements ICommandHandler<LinkEmployeeToUserCommand> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
        private readonly queryBus: QueryBus,
    ) {}

    async execute(cmd: LinkEmployeeToUserCommand): Promise<void> {
        const employee = await this.employeeRepo.findOneById(cmd.employeeId);
        if (!employee) {
            throw new EmployeeNotFoundError(cmd.employeeId);
        }

        await this.validateUserExists(cmd.userId);

        employee.linkToUser(cmd.userId);

        await this.employeeRepo.save(employee);
        await this.uow.commit();

        for (const event of employee.domainEvents) {
            await this.eventBus.publish(event);
        }
        employee.clearEvents();
    }

    private async validateUserExists(userId: string): Promise<void> {
        const user = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(userId),
        );
        if (!user) {
            throw new UserNotFoundError(userId);
        }
    }
}
