import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { WorkingHoursEntryRepositoryPort } from "../../database/working-hours-entry.repository.port.js";
import { WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import {
    GetEmployeeWorkingHoursQuery,
    type GetEmployeeWorkingHoursResponse,
    type WorkingHoursEntryItem,
} from "./get-employee-working-hours.query.js";

@QueryHandler(GetEmployeeWorkingHoursQuery)
export class GetEmployeeWorkingHoursQueryHandler implements IQueryHandler<
    GetEmployeeWorkingHoursQuery,
    GetEmployeeWorkingHoursResponse
> {
    constructor(
        @Inject(WORKING_HOURS_ENTRY_REPOSITORY_PORT)
        private readonly workingHoursRepo: WorkingHoursEntryRepositoryPort,
    ) {}

    async execute(query: GetEmployeeWorkingHoursQuery): Promise<GetEmployeeWorkingHoursResponse> {
        const entries = await this.workingHoursRepo.findByEmployeeAndDateRange({
            employeeId: query.employeeId,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
        });

        return entries.map((entry): WorkingHoursEntryItem => {
            const props = entry.properties;
            return {
                id: entry.id as string,
                employeeId: props.employeeId,
                date: props.date,
                hours: props.hours,
                note: props.note,
                activityId: props.activityId,
                status: props.status,
                lockedBy: props.lockedBy,
            };
        });
    }
}
