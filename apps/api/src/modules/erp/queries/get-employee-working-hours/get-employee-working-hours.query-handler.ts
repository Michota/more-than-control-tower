import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryBus, QueryHandler } from "@nestjs/cqrs";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../../../shared/queries/get-employee.query.js";
import { WorkingHoursNotOwnedError } from "../../domain/working-hours-entry.errors.js";
import type { WorkingHoursEntryRepositoryPort } from "../../database/working-hours-entry.repository.port.js";
import { WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { ErpPermission } from "../../erp.permissions.js";
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

        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: GetEmployeeWorkingHoursQuery): Promise<GetEmployeeWorkingHoursResponse> {
        const isOwner = await this.isOwner(query.actorId, query.employeeId);

        if (!isOwner) {
            const canManage = await this.hasManagePermission(query.actorId);
            if (!canManage) {
                throw new WorkingHoursNotOwnedError(query.employeeId);
            }
        }

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

    private async isOwner(actorUserId: string, employeeId: string): Promise<boolean> {
        const employee = await this.queryBus.execute<GetEmployeeQuery, GetEmployeeResponse | null>(
            new GetEmployeeQuery(employeeId),
        );
        return employee?.userId === actorUserId;
    }

    private async hasManagePermission(userId: string): Promise<boolean> {
        const permissions = await this.queryBus.execute<
            GetEmployeePermissionsQuery,
            GetEmployeePermissionsResponse | null
        >(new GetEmployeePermissionsQuery(userId));
        return permissions?.effectivePermissions.includes(ErpPermission.MANAGE_WORKING_HOURS) ?? false;
    }
}
