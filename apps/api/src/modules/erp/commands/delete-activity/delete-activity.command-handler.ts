import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { ActivityNotFoundError, ActivityInUseError } from "../../domain/activity.errors.js";
import type { ActivityRepositoryPort } from "../../database/activity.repository.port.js";
import type { WorkingHoursEntryRepositoryPort } from "../../database/working-hours-entry.repository.port.js";
import { ACTIVITY_REPOSITORY_PORT, WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { DeleteActivityCommand } from "./delete-activity.command.js";

@CommandHandler(DeleteActivityCommand)
export class DeleteActivityCommandHandler implements ICommandHandler<DeleteActivityCommand> {
    constructor(
        @Inject(ACTIVITY_REPOSITORY_PORT)
        private readonly activityRepo: ActivityRepositoryPort,

        @Inject(WORKING_HOURS_ENTRY_REPOSITORY_PORT)
        private readonly workingHoursRepo: WorkingHoursEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: DeleteActivityCommand): Promise<void> {
        const activity = await this.activityRepo.findOneById(cmd.activityId);

        if (!activity) {
            throw new ActivityNotFoundError(cmd.activityId);
        }

        const inUse = await this.workingHoursRepo.existsByActivityId(cmd.activityId);
        if (inUse) {
            throw new ActivityInUseError(cmd.activityId);
        }

        await this.activityRepo.delete(activity);
        await this.uow.commit();
    }
}
