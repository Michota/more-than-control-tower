import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { WorkingHoursEntryRepositoryPort } from "../../database/working-hours-entry.repository.port.js";
import { WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { LockWorkingHoursCommand } from "./lock-working-hours.command.js";

@CommandHandler(LockWorkingHoursCommand)
export class LockWorkingHoursCommandHandler implements ICommandHandler<LockWorkingHoursCommand> {
    constructor(
        @Inject(WORKING_HOURS_ENTRY_REPOSITORY_PORT)
        private readonly workingHoursRepo: WorkingHoursEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: LockWorkingHoursCommand): Promise<void> {
        const entries = await this.workingHoursRepo.findOpenByEmployeeAndDateRange({
            employeeId: cmd.employeeId,
            dateFrom: cmd.dateFrom,
            dateTo: cmd.dateTo,
        });

        for (const entry of entries) {
            entry.lock(cmd.lockedBy);
        }

        if (entries.length > 0) {
            await this.workingHoursRepo.save(entries);
            await this.uow.commit();

            for (const entry of entries) {
                this.eventBus.publishAll(entry.domainEvents);
                entry.clearEvents();
            }
        }
    }
}
