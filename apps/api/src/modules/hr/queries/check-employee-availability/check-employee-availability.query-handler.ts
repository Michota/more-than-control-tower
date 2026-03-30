import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    CheckEmployeeAvailabilityQuery,
    CheckEmployeeAvailabilityResponse,
} from "../../../../shared/queries/check-employee-availability.query.js";
import { AvailabilityEntryStatus } from "../../domain/availability-entry-status.enum.js";
import type { AvailabilityEntryRepositoryPort } from "../../database/availability-entry.repository.port.js";
import { AVAILABILITY_ENTRY_REPOSITORY_PORT } from "../../hr.di-tokens.js";

@QueryHandler(CheckEmployeeAvailabilityQuery)
export class CheckEmployeeAvailabilityQueryHandler implements IQueryHandler<
    CheckEmployeeAvailabilityQuery,
    CheckEmployeeAvailabilityResponse
> {
    constructor(
        @Inject(AVAILABILITY_ENTRY_REPOSITORY_PORT)
        private readonly availabilityRepo: AvailabilityEntryRepositoryPort,
    ) {}

    async execute(query: CheckEmployeeAvailabilityQuery): Promise<CheckEmployeeAvailabilityResponse> {
        const entries = await this.availabilityRepo.findByEmployeeIdAndDates(query.employeeId, [query.date]);
        const confirmedEntries = entries.filter((e) => e.status === AvailabilityEntryStatus.CONFIRMED);

        if (confirmedEntries.length === 0) {
            return {
                employeeId: query.employeeId,
                date: query.date,
                available: false,
                reason: "No confirmed availability entries for this date",
            };
        }

        return {
            employeeId: query.employeeId,
            date: query.date,
            available: true,
        };
    }
}
