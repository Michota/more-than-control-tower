import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { EmployeeNotFoundError } from "../../domain/employee.errors.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { SetPermissionOverrideCommand } from "./set-permission-override.command.js";

@CommandHandler(SetPermissionOverrideCommand)
export class SetPermissionOverrideCommandHandler implements ICommandHandler<SetPermissionOverrideCommand> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: SetPermissionOverrideCommand): Promise<void> {
        const employee = await this.employeeRepo.findOneById(cmd.employeeId);
        if (!employee) {
            throw new EmployeeNotFoundError(cmd.employeeId);
        }

        if (cmd.state === null) {
            employee.removePermissionOverride(cmd.permissionKey);
        } else {
            employee.setPermissionOverride(cmd.permissionKey, cmd.state);
        }

        await this.employeeRepo.save(employee);
        await this.uow.commit();
    }
}
