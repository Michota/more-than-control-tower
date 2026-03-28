import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { EmployeeNotFoundError } from "../../domain/employee.errors.js";
import { AvailabilityLockedError, AvailabilityNotOwnedError } from "../../domain/availability-entry.errors.js";
import { AvailabilityEntryAggregate } from "../../domain/availability-entry.aggregate.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import type { AvailabilityEntryRepositoryPort } from "../../database/availability-entry.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT, AVAILABILITY_ENTRY_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { SetAvailabilityCommand } from "./set-availability.command.js";

@CommandHandler(SetAvailabilityCommand)
export class SetAvailabilityCommandHandler implements ICommandHandler<SetAvailabilityCommand> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(AVAILABILITY_ENTRY_REPOSITORY_PORT)
        private readonly availabilityRepo: AvailabilityEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: SetAvailabilityCommand): Promise<void> {
        const employee = await this.employeeRepo.findOneById(cmd.employeeId);
        if (!employee) {
            throw new EmployeeNotFoundError(cmd.employeeId);
        }

        const dates = [...new Set(cmd.entries.map((e) => e.date))];

        if (!cmd.setByManager) {
            if (employee.userId !== cmd.requestedByUserId) {
                throw new AvailabilityNotOwnedError(cmd.employeeId);
            }

            const existing = await this.availabilityRepo.findByEmployeeIdAndDates(cmd.employeeId, dates);
            const now = new Date();
            const lockedDates = existing.filter((e) => e.isLocked(now)).map((e) => e.date);
            if (lockedDates.length > 0) {
                throw new AvailabilityLockedError([...new Set(lockedDates)]);
            }
        }

        await this.availabilityRepo.deleteByEmployeeIdAndDates(cmd.employeeId, dates);

        const entries = cmd.entries.map((e) =>
            AvailabilityEntryAggregate.create({
                employeeId: cmd.employeeId,
                date: e.date,
                startTime: e.startTime,
                endTime: e.endTime,
                setByManager: cmd.setByManager,
            }),
        );

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
