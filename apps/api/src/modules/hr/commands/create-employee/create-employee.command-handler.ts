import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";
import { EmployeeStatus } from "../../domain/employee-status.enum.js";
import { EmployeeAggregate } from "../../domain/employee.aggregate.js";
import {
    EmployeeDuplicateEmailError,
    EmployeeDuplicatePhoneError,
    UserNotFoundError,
} from "../../domain/employee.errors.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { CreateEmployeeCommand } from "./create-employee.command.js";

@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeCommandHandler implements ICommandHandler<CreateEmployeeCommand> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
        private readonly queryBus: QueryBus,
    ) {}

    async execute(cmd: CreateEmployeeCommand): Promise<IdOfEntity<EmployeeAggregate>> {
        if (cmd.userId) {
            await this.validateUserExists(cmd.userId);
        }

        if (!cmd.skipUniquenessCheck) {
            await this.validateUniqueness(cmd.email, cmd.phone);
        }

        const employee = EmployeeAggregate.create({
            firstName: cmd.firstName,
            lastName: cmd.lastName,
            email: cmd.email,
            phone: cmd.phone,
            userId: cmd.userId,
        });

        await this.employeeRepo.save(employee);
        await this.uow.commit();

        for (const event of employee.domainEvents) {
            await this.eventBus.publish(event);
        }
        employee.clearEvents();

        return employee.id;
    }

    private async validateUserExists(userId: string): Promise<void> {
        const user = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(userId),
        );
        if (!user) {
            throw new UserNotFoundError(userId);
        }
    }

    private async validateUniqueness(email?: string, phone?: string): Promise<void> {
        if (email) {
            const existing = await this.employeeRepo.findByEmail(email);
            if (existing && existing.status === EmployeeStatus.ACTIVE) {
                throw new EmployeeDuplicateEmailError(email);
            }
        }

        if (phone) {
            const existing = await this.employeeRepo.findByPhone(phone);
            if (existing && existing.status === EmployeeStatus.ACTIVE) {
                throw new EmployeeDuplicatePhoneError(phone);
            }
        }
    }
}
