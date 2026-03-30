import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { SystemUserRole } from "../../domain/system-user-role.enum.js";
import { LastActiveAdminError, SystemUserNotFoundError } from "../../domain/system-user.errors.js";
import type { SystemUserRepositoryPort } from "../../database/system-user.repository.port.js";
import { SYSTEM_USER_REPOSITORY_PORT } from "../../system.di-tokens.js";
import { AssignRolesCommand } from "./assign-roles.command.js";

@CommandHandler(AssignRolesCommand)
export class AssignRolesCommandHandler implements ICommandHandler<AssignRolesCommand> {
    constructor(
        @Inject(SYSTEM_USER_REPOSITORY_PORT)
        private readonly userRepo: SystemUserRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: AssignRolesCommand): Promise<void> {
        const user = await this.userRepo.findOneById(cmd.userId);
        if (!user) {
            throw new SystemUserNotFoundError(cmd.userId);
        }

        const isRemovingAdmin =
            user.roles.includes(SystemUserRole.ADMINISTRATOR) && !cmd.roles.includes(SystemUserRole.ADMINISTRATOR);

        if (isRemovingAdmin) {
            const activeAdminCount = await this.userRepo.countActiveAdmins();
            if (activeAdminCount <= 1) {
                throw new LastActiveAdminError();
            }
        }

        user.assignRoles(cmd.roles, cmd.actorId);

        await this.userRepo.save(user);
        await this.uow.commit();
    }
}
