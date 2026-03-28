import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { ActivityLogEntryRepositoryPort } from "../../database/activity-log-entry.repository.port.js";
import { ACTIVITY_LOG_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import {
    GetEmployeeActivityLogQuery,
    type GetEmployeeActivityLogResponse,
    type ActivityLogItem,
} from "./get-employee-activity-log.query.js";

@QueryHandler(GetEmployeeActivityLogQuery)
export class GetEmployeeActivityLogQueryHandler implements IQueryHandler<
    GetEmployeeActivityLogQuery,
    GetEmployeeActivityLogResponse
> {
    constructor(
        @Inject(ACTIVITY_LOG_ENTRY_REPOSITORY_PORT)
        private readonly activityLogRepo: ActivityLogEntryRepositoryPort,
    ) {}

    async execute(query: GetEmployeeActivityLogQuery): Promise<GetEmployeeActivityLogResponse> {
        const from = new Date(query.dateFrom);
        const to = new Date(query.dateTo + "T23:59:59.999Z");

        const entries = await this.activityLogRepo.findByEmployeeAndDateRange(query.employeeId, from, to);

        return entries.map(
            (entry): ActivityLogItem => ({
                id: entry.id as string,
                employeeId: entry.properties.employeeId,
                action: entry.properties.action,
                details: entry.properties.details,
                occurredAt: entry.properties.occurredAt.toISOString(),
            }),
        );
    }
}
