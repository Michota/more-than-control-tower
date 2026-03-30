import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { ActivityAggregate } from "../../domain/activity.aggregate.js";
import type { ActivityRepositoryPort } from "../../database/activity.repository.port.js";
import { ACTIVITY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { CreateActivityCommand } from "./create-activity.command.js";

@CommandHandler(CreateActivityCommand)
export class CreateActivityCommandHandler implements ICommandHandler<CreateActivityCommand> {
    constructor(
        @Inject(ACTIVITY_REPOSITORY_PORT)
        private readonly activityRepo: ActivityRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateActivityCommand): Promise<string> {
        const activity = ActivityAggregate.create({
            name: cmd.name,
            description: cmd.description,
        });

        await this.activityRepo.save(activity);
        await this.uow.commit();

        this.eventBus.publishAll(activity.domainEvents);
        activity.clearEvents();

        return activity.id as string;
    }
}
