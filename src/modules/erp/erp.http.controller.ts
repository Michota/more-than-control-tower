import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { RequirePermission } from "../../shared/auth/decorators/require-permission.decorator.js";
import { CurrentUser, type RequestUser } from "../../shared/auth/decorators/current-user.decorator.js";
import { CreateActivityCommand } from "./commands/create-activity/create-activity.command.js";
import { CreateActivityRequest } from "./commands/create-activity/create-activity.request.dto.js";
import { DeleteActivityCommand } from "./commands/delete-activity/delete-activity.command.js";
import { DeleteActivityParams } from "./commands/delete-activity/delete-activity.request.dto.js";
import { LogWorkingHoursCommand } from "./commands/log-working-hours/log-working-hours.command.js";
import { LogWorkingHoursRequest } from "./commands/log-working-hours/log-working-hours.request.dto.js";
import { EditWorkingHoursCommand } from "./commands/edit-working-hours/edit-working-hours.command.js";
import {
    EditWorkingHoursParams,
    EditWorkingHoursRequest,
} from "./commands/edit-working-hours/edit-working-hours.request.dto.js";
import { DeleteWorkingHoursCommand } from "./commands/delete-working-hours/delete-working-hours.command.js";
import { DeleteWorkingHoursParams } from "./commands/delete-working-hours/delete-working-hours.request.dto.js";
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
import {
    GetEmployeeActivityLogQuery,
    type GetEmployeeActivityLogResponse,
} from "./queries/get-employee-activity-log/get-employee-activity-log.query.js";
import {
    GetEmployeeActivityLogParams,
    GetEmployeeActivityLogQueryDto,
} from "./queries/get-employee-activity-log/get-employee-activity-log.request.dto.js";
import { ErpPermission } from "./erp.permissions.js";

@Controller("erp")
export class ErpHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    // ─── Activities ──────────────────────────────────────────

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

    @RequirePermission(ErpPermission.DELETE_ACTIVITY)
    @Delete("activities/:id")
    async deleteActivity(@Param() params: DeleteActivityParams): Promise<void> {
        await this.commandBus.execute(new DeleteActivityCommand({ activityId: params.id }));
    }

    // ─── Working Hours ───────────────────────────────────────

    @RequirePermission(ErpPermission.VIEW_WORKING_HOURS)
    @Get("working-hours/:employeeId")
    async getEmployeeWorkingHours(
        @Param() params: GetEmployeeWorkingHoursParams,
        @Query() query: GetEmployeeWorkingHoursQueryDto,
        @CurrentUser() user: RequestUser,
    ): Promise<GetEmployeeWorkingHoursResponse> {
        return this.queryBus.execute(
            new GetEmployeeWorkingHoursQuery(params.employeeId, query.dateFrom, query.dateTo, user.userId),
        );
    }

    @RequirePermission(ErpPermission.LOG_WORKING_HOURS)
    @Post("working-hours")
    async logWorkingHours(
        @Body() body: LogWorkingHoursRequest,
        @CurrentUser() user: RequestUser,
    ): Promise<{ entryId: string }> {
        const entryId = await this.commandBus.execute(
            new LogWorkingHoursCommand({
                employeeId: body.employeeId,
                actorId: user.userId,
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
        @CurrentUser() user: RequestUser,
    ): Promise<void> {
        await this.commandBus.execute(
            new EditWorkingHoursCommand({
                entryId: params.id,
                actorId: user.userId,
                hours: body.hours,
                note: body.note,
                activityId: body.activityId,
            }),
        );
    }

    @RequirePermission(ErpPermission.DELETE_WORKING_HOURS)
    @Delete("working-hours/:id")
    async deleteWorkingHours(
        @Param() params: DeleteWorkingHoursParams,
        @CurrentUser() user: RequestUser,
    ): Promise<void> {
        await this.commandBus.execute(new DeleteWorkingHoursCommand({ entryId: params.id, actorId: user.userId }));
    }

    @RequirePermission(ErpPermission.LOCK_WORKING_HOURS)
    @Post("working-hours/lock")
    async lockWorkingHours(@Body() body: LockWorkingHoursRequest, @CurrentUser() user: RequestUser): Promise<void> {
        await this.commandBus.execute(
            new LockWorkingHoursCommand({
                employeeId: body.employeeId,
                dateFrom: body.dateFrom,
                dateTo: body.dateTo,
                actorId: user.userId,
            }),
        );
    }

    // ─── Activity Log ────────────────────────────────────────

    @RequirePermission(ErpPermission.VIEW_ACTIVITY_LOG)
    @Get("activity-log/:employeeId")
    async getEmployeeActivityLog(
        @Param() params: GetEmployeeActivityLogParams,
        @Query() query: GetEmployeeActivityLogQueryDto,
    ): Promise<GetEmployeeActivityLogResponse> {
        return this.queryBus.execute(new GetEmployeeActivityLogQuery(params.employeeId, query.dateFrom, query.dateTo));
    }
}
