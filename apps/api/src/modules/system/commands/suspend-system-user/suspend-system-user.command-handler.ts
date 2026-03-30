import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { SystemUserRole } from "../../domain/system-user-role.enum.js";
import { LastActiveAdminError, SystemUserNotFoundError } from "../../domain/system-user.errors.js";
import type { SystemUserRepositoryPort } from "../../database/system-user.repository.port.js";
import { SYSTEM_USER_REPOSITORY_PORT } from "../../system.di-tokens.js";
import { SuspendSystemUserCommand } from "./suspend-system-user.command.js";

@CommandHandler(SuspendSystemUserCommand)
export class SuspendSystemUserCommandHandler implements ICommandHandler<SuspendSystemUserCommand> {
    constructor(
        @Inject(SYSTEM_USER_REPOSITORY_PORT)
        private readonly userRepo: SystemUserRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: SuspendSystemUserCommand): Promise<void> {
        const user = await this.userRepo.findOneById(cmd.userId);
        if (!user) {
            throw new SystemUserNotFoundError(cmd.userId);
        }

        if (user.roles.includes(SystemUserRole.ADMINISTRATOR)) {
            const activeAdminCount = await this.userRepo.countActiveAdmins();
            if (activeAdminCount <= 1) {
                throw new LastActiveAdminError();
            }
        }

        user.suspend();

        await this.userRepo.save(user);
        await this.uow.commit();

        for (const event of user.domainEvents) {
            await this.eventBus.publish(event);
        }

        user.clearEvents();
    }
}
