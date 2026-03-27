import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { SystemUserNotFoundError } from "../../domain/system-user.errors.js";
import type { SystemUserRepositoryPort } from "../../database/system-user.repository.port.js";
import { SYSTEM_USER_REPOSITORY_PORT } from "../../system.di-tokens.js";
import { UpdateSystemUserCommand } from "./update-system-user.command.js";

@CommandHandler(UpdateSystemUserCommand)
export class UpdateSystemUserCommandHandler implements ICommandHandler<UpdateSystemUserCommand> {
    constructor(
        @Inject(SYSTEM_USER_REPOSITORY_PORT)
        private readonly userRepo: SystemUserRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: UpdateSystemUserCommand): Promise<void> {
        const user = await this.userRepo.findOneById(cmd.userId);
        if (!user) {
            throw new SystemUserNotFoundError(cmd.userId);
        }

        user.update({
            email: cmd.email,
            name: cmd.name,
        });

        await this.userRepo.save(user);
        await this.uow.commit();
    }
}
