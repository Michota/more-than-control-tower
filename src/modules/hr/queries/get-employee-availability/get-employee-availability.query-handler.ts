import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { AvailabilityEntryRepositoryPort } from "../../database/availability-entry.repository.port.js";
import { AvailabilityEntryMapper, type AvailabilityEntryResponse } from "../../database/availability-entry.mapper.js";
import { AVAILABILITY_ENTRY_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { GetEmployeeAvailabilityQuery } from "./get-employee-availability.query.js";

export interface GetEmployeeAvailabilityResponse {
    entries: AvailabilityEntryResponse[];
}

@QueryHandler(GetEmployeeAvailabilityQuery)
export class GetEmployeeAvailabilityQueryHandler implements IQueryHandler<
    GetEmployeeAvailabilityQuery,
    GetEmployeeAvailabilityResponse
> {
    private readonly mapper = new AvailabilityEntryMapper();

    constructor(
        @Inject(AVAILABILITY_ENTRY_REPOSITORY_PORT)
        private readonly availabilityRepo: AvailabilityEntryRepositoryPort,
    ) {}

    async execute(query: GetEmployeeAvailabilityQuery): Promise<GetEmployeeAvailabilityResponse> {
        const entries =
            query.fromDate && query.toDate
                ? await this.availabilityRepo.findByEmployeeIdAndDateRange(
                      query.employeeId,
                      query.fromDate,
                      query.toDate,
                  )
                : await this.availabilityRepo.findByEmployeeId(query.employeeId);

        return {
            entries: entries.map((e) => this.mapper.toResponse(e)),
        };
    }
}
