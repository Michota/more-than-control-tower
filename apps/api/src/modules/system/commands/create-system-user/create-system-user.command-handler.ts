import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { SystemUserAggregate } from "../../domain/system-user.aggregate.js";
import { SystemUserDuplicateEmailError } from "../../domain/system-user.errors.js";
import type { SystemUserRepositoryPort } from "../../database/system-user.repository.port.js";
import { SYSTEM_USER_REPOSITORY_PORT } from "../../system.di-tokens.js";
import { CreateSystemUserCommand } from "./create-system-user.command.js";

@CommandHandler(CreateSystemUserCommand)
export class CreateSystemUserCommandHandler implements ICommandHandler<CreateSystemUserCommand> {
    constructor(
        @Inject(SYSTEM_USER_REPOSITORY_PORT)
        private readonly userRepo: SystemUserRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateSystemUserCommand): Promise<IdOfEntity<SystemUserAggregate>> {
        const existing = await this.userRepo.findByEmail(cmd.email);
        if (existing) {
            throw new SystemUserDuplicateEmailError(cmd.email);
        }

        const user = SystemUserAggregate.create({
            email: cmd.email,
            name: cmd.name,
            roles: cmd.roles,
        });

        await this.userRepo.save(user);
        await this.uow.commit();

        for (const event of user.domainEvents) {
            await this.eventBus.publish(event);
        }

        user.clearEvents();

        return user.id;
    }
}
