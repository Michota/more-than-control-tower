import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { WorkingHoursEntryNotFoundError } from "../../domain/working-hours-entry.errors.js";
import type { WorkingHoursEntryRepositoryPort } from "../../database/working-hours-entry.repository.port.js";
import { WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { DeleteWorkingHoursCommand } from "./delete-working-hours.command.js";

@CommandHandler(DeleteWorkingHoursCommand)
export class DeleteWorkingHoursCommandHandler implements ICommandHandler<DeleteWorkingHoursCommand> {
    constructor(
        @Inject(WORKING_HOURS_ENTRY_REPOSITORY_PORT)
        private readonly workingHoursRepo: WorkingHoursEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: DeleteWorkingHoursCommand): Promise<void> {
        const entry = await this.workingHoursRepo.findOneById(cmd.entryId);

        if (!entry) {
            throw new WorkingHoursEntryNotFoundError(cmd.entryId);
        }

        entry.ensureDeletable();

        await this.workingHoursRepo.delete(entry);
        await this.uow.commit();
    }
}
