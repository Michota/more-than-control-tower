import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { CreateActivityCommandHandler } from "./commands/create-activity/create-activity.command-handler.js";
import { DeleteActivityCommandHandler } from "./commands/delete-activity/delete-activity.command-handler.js";
import { LogWorkingHoursCommandHandler } from "./commands/log-working-hours/log-working-hours.command-handler.js";
import { EditWorkingHoursCommandHandler } from "./commands/edit-working-hours/edit-working-hours.command-handler.js";
import { DeleteWorkingHoursCommandHandler } from "./commands/delete-working-hours/delete-working-hours.command-handler.js";
import { LockWorkingHoursCommandHandler } from "./commands/lock-working-hours/lock-working-hours.command-handler.js";
import { ListActivitiesQueryHandler } from "./queries/list-activities/list-activities.query-handler.js";
import { GetEmployeeWorkingHoursQueryHandler } from "./queries/get-employee-working-hours/get-employee-working-hours.query-handler.js";
import { GetEmployeeActivityLogQueryHandler } from "./queries/get-employee-activity-log/get-employee-activity-log.query-handler.js";
import { ErpHttpController } from "./erp.http.controller.js";
import {
    ACTIVITY_REPOSITORY_PORT,
    WORKING_HOURS_ENTRY_REPOSITORY_PORT,
    ACTIVITY_LOG_ENTRY_REPOSITORY_PORT,
} from "./erp.di-tokens.js";
import { Activity } from "./database/activity.entity.js";
import { WorkingHoursEntry } from "./database/working-hours-entry.entity.js";
import { ActivityLogEntry } from "./database/activity-log-entry.entity.js";
import { ActivityRepository } from "./database/activity.repository.js";
import { WorkingHoursEntryRepository } from "./database/working-hours-entry.repository.js";
import { ActivityLogEntryRepository } from "./database/activity-log-entry.repository.js";
import { ActivityLogService } from "./infrastructure/activity-log.service.js";
import { ActivityLogCleanupCron } from "./infrastructure/activity-log-cleanup.cron.js";

@Module({
    imports: [MikroOrmModule.forFeature([Activity, WorkingHoursEntry, ActivityLogEntry]), ScheduleModule.forRoot()],
    controllers: [ErpHttpController],
    providers: [
        CreateActivityCommandHandler,
        DeleteActivityCommandHandler,
        LogWorkingHoursCommandHandler,
        EditWorkingHoursCommandHandler,
        DeleteWorkingHoursCommandHandler,
        LockWorkingHoursCommandHandler,
        ListActivitiesQueryHandler,
        GetEmployeeWorkingHoursQueryHandler,
        GetEmployeeActivityLogQueryHandler,
        ActivityLogService,
        ActivityLogCleanupCron,
        {
            provide: ACTIVITY_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new ActivityRepository(em),
            inject: [EntityManager],
        },
        {
            provide: WORKING_HOURS_ENTRY_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new WorkingHoursEntryRepository(em),
            inject: [EntityManager],
        },
        {
            provide: ACTIVITY_LOG_ENTRY_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new ActivityLogEntryRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
    ],
    exports: [
        ACTIVITY_REPOSITORY_PORT,
        WORKING_HOURS_ENTRY_REPOSITORY_PORT,
        ACTIVITY_LOG_ENTRY_REPOSITORY_PORT,
        UNIT_OF_WORK_PORT,
        ActivityLogService,
    ],
})
export class ErpModule implements OnModuleInit {
    constructor(
        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    onModuleInit(): void {
        this.permissionRegistry.registerForModule("erp", [
            { key: "create-activity", name: "Create Activity" },
            { key: "delete-activity", name: "Delete Activity" },
            { key: "view-activities", name: "View Activities" },
            { key: "log-working-hours", name: "Log Working Hours" },
            { key: "edit-working-hours", name: "Edit Working Hours" },
            { key: "delete-working-hours", name: "Delete Working Hours" },
            { key: "lock-working-hours", name: "Lock Working Hours" },
            { key: "manage-working-hours", name: "Manage Working Hours (view/edit/lock anyone)" },
            { key: "view-working-hours", name: "View Working Hours" },
            { key: "view-activity-log", name: "View Activity Log" },
        ]);
    }
}
