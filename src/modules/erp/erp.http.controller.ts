import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { RequirePermission } from "../../shared/auth/decorators/require-permission.decorator.js";
import { CreateActivityCommand } from "./commands/create-activity/create-activity.command.js";
import { CreateActivityRequest } from "./commands/create-activity/create-activity.request.dto.js";
import { LogWorkingHoursCommand } from "./commands/log-working-hours/log-working-hours.command.js";
import { LogWorkingHoursRequest } from "./commands/log-working-hours/log-working-hours.request.dto.js";
import { EditWorkingHoursCommand } from "./commands/edit-working-hours/edit-working-hours.command.js";
import {
    EditWorkingHoursParams,
    EditWorkingHoursRequest,
} from "./commands/edit-working-hours/edit-working-hours.request.dto.js";
import { LockWorkingHoursCommand } from "./commands/lock-working-hours/lock-working-hours.command.js";
import { LockWorkingHoursRequest } from "./commands/lock-working-hours/lock-working-hours.request.dto.js";
import { ListActivitiesQuery, type ListActivitiesResponse } from "./queries/list-activities/list-activities.query.js";
import {
    GetEmployeeWorkingHoursQuery,
    type GetEmployeeWorkingHoursResponse,
} from "./queries/get-employee-working-hours/get-employee-working-hours.query.js";
import {
    GetEmployeeWorkingHoursParams,
    GetEmployeeWorkingHoursQueryDto,
} from "./queries/get-employee-working-hours/get-employee-working-hours.request.dto.js";
import { ErpPermission } from "./erp.permissions.js";

@Controller("erp")
export class ErpHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @RequirePermission(ErpPermission.VIEW_ACTIVITIES)
    @Get("activities")
    async listActivities(): Promise<ListActivitiesResponse> {
        return this.queryBus.execute(new ListActivitiesQuery());
    }

    @RequirePermission(ErpPermission.CREATE_ACTIVITY)
    @Post("activities")
    async createActivity(@Body() body: CreateActivityRequest): Promise<{ activityId: string }> {
        const activityId = await this.commandBus.execute(
            new CreateActivityCommand({
                name: body.name,
                description: body.description,
            }),
        );
        return { activityId };
    }

    @RequirePermission(ErpPermission.VIEW_WORKING_HOURS)
    @Get("working-hours/:employeeId")
    async getEmployeeWorkingHours(
        @Param() params: GetEmployeeWorkingHoursParams,
        @Query() query: GetEmployeeWorkingHoursQueryDto,
    ): Promise<GetEmployeeWorkingHoursResponse> {
        return this.queryBus.execute(new GetEmployeeWorkingHoursQuery(params.employeeId, query.dateFrom, query.dateTo));
    }

    @RequirePermission(ErpPermission.LOG_WORKING_HOURS)
    @Post("working-hours")
    async logWorkingHours(@Body() body: LogWorkingHoursRequest): Promise<{ entryId: string }> {
        const entryId = await this.commandBus.execute(
            new LogWorkingHoursCommand({
                employeeId: body.employeeId,
                date: body.date,
                hours: body.hours,
                note: body.note,
                activityId: body.activityId,
            }),
        );
        return { entryId };
    }

    @RequirePermission(ErpPermission.EDIT_WORKING_HOURS)
    @Patch("working-hours/:id")
    async editWorkingHours(
        @Param() params: EditWorkingHoursParams,
        @Body() body: EditWorkingHoursRequest,
    ): Promise<void> {
        await this.commandBus.execute(
            new EditWorkingHoursCommand({
                entryId: params.id,
                hours: body.hours,
                note: body.note,
                activityId: body.activityId,
            }),
        );
    }

    @RequirePermission(ErpPermission.LOCK_WORKING_HOURS)
    @Post("working-hours/lock")
    async lockWorkingHours(@Body() body: LockWorkingHoursRequest): Promise<void> {
        await this.commandBus.execute(
            new LockWorkingHoursCommand({
                employeeId: body.employeeId,
                dateFrom: body.dateFrom,
                dateTo: body.dateTo,
                lockedBy: body.lockedBy,
            }),
        );
    }
}
