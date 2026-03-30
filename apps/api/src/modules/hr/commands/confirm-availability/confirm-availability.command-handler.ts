import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { EmployeeNotFoundError } from "../../domain/employee.errors.js";
import { AvailabilityEntryNotFoundError } from "../../domain/availability-entry.errors.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import type { AvailabilityEntryRepositoryPort } from "../../database/availability-entry.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT, AVAILABILITY_ENTRY_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { ConfirmAvailabilityCommand } from "./confirm-availability.command.js";

@CommandHandler(ConfirmAvailabilityCommand)
export class ConfirmAvailabilityCommandHandler implements ICommandHandler<ConfirmAvailabilityCommand> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(AVAILABILITY_ENTRY_REPOSITORY_PORT)
        private readonly availabilityRepo: AvailabilityEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: ConfirmAvailabilityCommand): Promise<void> {
        const employee = await this.employeeRepo.findOneById(cmd.employeeId);
        if (!employee) {
            throw new EmployeeNotFoundError(cmd.employeeId);
        }

        const entries = await this.availabilityRepo.findByEmployeeIdAndDates(cmd.employeeId, cmd.dates);
        if (entries.length === 0) {
            throw new AvailabilityEntryNotFoundError(cmd.dates.join(", "));
        }

        for (const entry of entries) {
            entry.confirm();
        }

        await this.availabilityRepo.save(entries);
        await this.uow.commit();

        for (const entry of entries) {
            for (const event of entry.domainEvents) {
                await this.eventBus.publish(event);
            }
            entry.clearEvents();
        }
    }
}
