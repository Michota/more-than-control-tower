import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { EmployeeNotFoundError } from "../../domain/employee.errors.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { UpdateEmployeeCommand } from "./update-employee.command.js";

@CommandHandler(UpdateEmployeeCommand)
export class UpdateEmployeeCommandHandler implements ICommandHandler<UpdateEmployeeCommand> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: UpdateEmployeeCommand): Promise<void> {
        const employee = await this.employeeRepo.findOneById(cmd.employeeId);
        if (!employee) {
            throw new EmployeeNotFoundError(cmd.employeeId);
        }

        employee.update({
            firstName: cmd.firstName,
            lastName: cmd.lastName,
            email: cmd.email,
            phone: cmd.phone,
        });

        await this.employeeRepo.save(employee);
        await this.uow.commit();
    }
}
