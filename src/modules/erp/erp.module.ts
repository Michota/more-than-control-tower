import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Inject, Module, OnModuleInit } from "@nestjs/common";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { CreateActivityCommandHandler } from "./commands/create-activity/create-activity.command-handler.js";
import { LogWorkingHoursCommandHandler } from "./commands/log-working-hours/log-working-hours.command-handler.js";
import { EditWorkingHoursCommandHandler } from "./commands/edit-working-hours/edit-working-hours.command-handler.js";
import { LockWorkingHoursCommandHandler } from "./commands/lock-working-hours/lock-working-hours.command-handler.js";
import { ListActivitiesQueryHandler } from "./queries/list-activities/list-activities.query-handler.js";
import { GetEmployeeWorkingHoursQueryHandler } from "./queries/get-employee-working-hours/get-employee-working-hours.query-handler.js";
import { ErpHttpController } from "./erp.http.controller.js";
import { ACTIVITY_REPOSITORY_PORT, WORKING_HOURS_ENTRY_REPOSITORY_PORT } from "./erp.di-tokens.js";
import { Activity } from "./database/activity.entity.js";
import { WorkingHoursEntry } from "./database/working-hours-entry.entity.js";
import { ActivityRepository } from "./database/activity.repository.js";
import { WorkingHoursEntryRepository } from "./database/working-hours-entry.repository.js";

@Module({
    imports: [MikroOrmModule.forFeature([Activity, WorkingHoursEntry])],
    controllers: [ErpHttpController],
    providers: [
        CreateActivityCommandHandler,
        LogWorkingHoursCommandHandler,
        EditWorkingHoursCommandHandler,
        LockWorkingHoursCommandHandler,
        ListActivitiesQueryHandler,
        GetEmployeeWorkingHoursQueryHandler,
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
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
    ],
    exports: [ACTIVITY_REPOSITORY_PORT, WORKING_HOURS_ENTRY_REPOSITORY_PORT, UNIT_OF_WORK_PORT],
})
export class ErpModule implements OnModuleInit {
    constructor(
        @Inject(PERMISSION_REGISTRY)
        private readonly permissionRegistry: PermissionRegistry,
    ) {}

    onModuleInit(): void {
        this.permissionRegistry.registerForModule("erp", [
            { key: "create-activity", name: "Create Activity" },
            { key: "view-activities", name: "View Activities" },
            { key: "log-working-hours", name: "Log Working Hours" },
            { key: "edit-working-hours", name: "Edit Working Hours" },
            { key: "lock-working-hours", name: "Lock Working Hours" },
            { key: "view-working-hours", name: "View Working Hours" },
        ]);
    }
}
