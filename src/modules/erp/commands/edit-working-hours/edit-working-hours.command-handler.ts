import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { WorkingHoursEntryNotFoundError } from "../../domain/working-hours-entry.errors.js";
import { ActivityNotFoundError } from "../../domain/activity.errors.js";
import type { ActivityRepositoryPort } from "../../database/activity.repository.port.js";
import type { WorkingHoursEntryRepositoryPort } from "../../database/working-hours-entry.repository.port.js";
import { ACTIVITY_REPOSITORY_PORT, WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { EditWorkingHoursCommand } from "./edit-working-hours.command.js";

@CommandHandler(EditWorkingHoursCommand)
export class EditWorkingHoursCommandHandler implements ICommandHandler<EditWorkingHoursCommand> {
    constructor(
        @Inject(WORKING_HOURS_ENTRY_REPOSITORY_PORT)
        private readonly workingHoursRepo: WorkingHoursEntryRepositoryPort,

        @Inject(ACTIVITY_REPOSITORY_PORT)
        private readonly activityRepo: ActivityRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: EditWorkingHoursCommand): Promise<void> {
        const entry = await this.workingHoursRepo.findOneById(cmd.entryId);

        if (!entry) {
            throw new WorkingHoursEntryNotFoundError(cmd.entryId);
        }

        if (cmd.activityId) {
            const activity = await this.activityRepo.findOneById(cmd.activityId);
            if (!activity) {
                throw new ActivityNotFoundError(cmd.activityId);
            }
        }

        entry.edit({
            hours: cmd.hours,
            note: cmd.note,
            activityId: cmd.activityId,
        });

        await this.workingHoursRepo.save(entry);
        await this.uow.commit();

        this.eventBus.publishAll(entry.domainEvents);
        entry.clearEvents();
    }
}
