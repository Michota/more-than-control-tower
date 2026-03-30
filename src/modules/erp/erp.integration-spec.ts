import { randomUUID } from "crypto";
import { MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { PermissionRegistryModule } from "../../shared/infrastructure/permission-registry.module";
import { ErpModule } from "./erp.module";
import { HrModule } from "../hr/hr.module";
import { CreateActivityCommand } from "./commands/create-activity/create-activity.command";
import { LogWorkingHoursCommand } from "./commands/log-working-hours/log-working-hours.command";
import { EditWorkingHoursCommand } from "./commands/edit-working-hours/edit-working-hours.command";
import { DeleteWorkingHoursCommand } from "./commands/delete-working-hours/delete-working-hours.command";
import { LockWorkingHoursCommand } from "./commands/lock-working-hours/lock-working-hours.command";
import { DeleteActivityCommand } from "./commands/delete-activity/delete-activity.command";
import { ListActivitiesQuery, type ListActivitiesResponse } from "./queries/list-activities/list-activities.query";
import {
    GetEmployeeWorkingHoursQuery,
    type GetEmployeeWorkingHoursResponse,
} from "./queries/get-employee-working-hours/get-employee-working-hours.query";
import {
    GetEmployeeActivityLogQuery,
    type GetEmployeeActivityLogResponse,
} from "./queries/get-employee-activity-log/get-employee-activity-log.query";
import { WorkingHoursStatus } from "./domain/working-hours-status.enum";
import {
    WorkingHoursEntryLockedError,
    WorkingHoursEntryNotFoundError,
    WorkingHoursNotOwnedError,
} from "./domain/working-hours-entry.errors";
import { ActivityNotFoundError, ActivityInUseError } from "./domain/activity.errors";
import { ActivityLogService } from "./infrastructure/activity-log.service";
import { ActivityLogCleanupCron } from "./infrastructure/activity-log-cleanup.cron";
import { CreateEmployeeCommand } from "../hr/commands/create-employee/create-employee.command";
import { CreatePositionCommand } from "../hr/commands/create-position/create-position.command";
import { AssignPositionCommand } from "../hr/commands/assign-position/assign-position.command";

describe("ERP Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;

    const MANAGER_USER_ID = randomUUID();
    let workerUserId: string;
    let workerEmployeeId: string;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TestMikroOrmDatabaseModule(),
                CqrsModule.forRoot(),
                PermissionRegistryModule,
                ErpModule,
                HrModule,
            ],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        queryBus = moduleRef.get(QueryBus);
        orm = moduleRef.get(MikroORM);

        await orm.schema.refresh();

        // Create manager with erp:manage-working-hours permission
        await commandBus.execute(
            new CreatePositionCommand({
                key: "erp:manager",
                displayName: "ERP Manager",
                permissionKeys: ["erp:manage-working-hours"],
            }),
        );
        const managerEmployeeId: string = await commandBus.execute(
            new CreateEmployeeCommand({
                firstName: "Manager",
                lastName: "ERP",
                email: "erp-manager@test.com",
                phone: "+48000000001",
            }),
        );
        await orm.em.nativeUpdate("Employee", { id: managerEmployeeId }, { userId: MANAGER_USER_ID });
        orm.em.clear();
        await commandBus.execute(
            new AssignPositionCommand({
                employeeId: managerEmployeeId,
                positionKey: "erp:manager",
                assignedBy: "system",
            }),
        );

        // Create a regular worker (linked to a userId)
        workerEmployeeId = await commandBus.execute(
            new CreateEmployeeCommand({
                firstName: "Worker",
                lastName: "ERP",
                email: "erp-worker@test.com",
                phone: "+48000000002",
            }),
        );
        workerUserId = `erp-worker-user-${randomUUID().slice(0, 8)}`;
        await orm.em.nativeUpdate("Employee", { id: workerEmployeeId }, { userId: workerUserId });
        orm.em.clear();
    });

    afterAll(async () => {
        await orm.close(true);
        await moduleRef.close();
    });

    // ─── Activities ──────────────────────────────────────────

    describe("Activities", () => {
        it("creates an activity", async () => {
            const activityId: string = await commandBus.execute(
                new CreateActivityCommand({ name: "Loading truck", description: "Loading goods onto truck" }),
            );

            expect(activityId).toBeDefined();

            const activities: ListActivitiesResponse = await queryBus.execute(new ListActivitiesQuery());
            const created = activities.find((a) => a.id === activityId);

            expect(created).toBeDefined();
            expect(created!.name).toBe("Loading truck");
            expect(created!.description).toBe("Loading goods onto truck");
        });

        it("creates an activity without description", async () => {
            const activityId: string = await commandBus.execute(new CreateActivityCommand({ name: "Warehouse work" }));

            const activities: ListActivitiesResponse = await queryBus.execute(new ListActivitiesQuery());
            const created = activities.find((a) => a.id === activityId);

            expect(created).toBeDefined();
            expect(created!.description).toBeUndefined();
        });
    });

    // ─── Log Working Hours ───────────────────────────────────

    describe("Log Working Hours", () => {
        it("logs own working hours", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-03-28",
                    hours: 4,
                    note: "Morning shift",
                }),
            );

            expect(entryId).toBeDefined();

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(workerEmployeeId, "2026-03-28", "2026-03-28", workerUserId),
            );

            const logged = entries.find((e) => e.id === entryId);
            expect(logged).toBeDefined();
            expect(logged!.hours).toBe(4);
            expect(logged!.status).toBe(WorkingHoursStatus.OPEN as string);
        });

        it("manager can log hours for another employee", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: MANAGER_USER_ID,
                    date: "2026-03-29",
                    hours: 6,
                }),
            );

            expect(entryId).toBeDefined();
        });

        it("throws WorkingHoursNotOwnedError when non-manager logs for another employee", async () => {
            const otherEmployeeId = randomUUID();

            await expect(
                commandBus.execute(
                    new LogWorkingHoursCommand({
                        employeeId: otherEmployeeId,
                        actorId: workerUserId,
                        date: "2026-03-28",
                        hours: 2,
                    }),
                ),
            ).rejects.toThrow(WorkingHoursNotOwnedError);
        });

        it("throws ActivityNotFoundError for non-existent activity", async () => {
            await expect(
                commandBus.execute(
                    new LogWorkingHoursCommand({
                        employeeId: workerEmployeeId,
                        actorId: workerUserId,
                        date: "2026-03-28",
                        hours: 2,
                        activityId: randomUUID(),
                    }),
                ),
            ).rejects.toThrow(ActivityNotFoundError);
        });
    });

    // ─── View Working Hours ──────────────────────────────────

    describe("View Working Hours — ownership", () => {
        it("worker can view own hours", async () => {
            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(workerEmployeeId, "2026-03-28", "2026-03-28", workerUserId),
            );

            expect(entries.length).toBeGreaterThanOrEqual(1);
        });

        it("manager can view anyone's hours", async () => {
            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(workerEmployeeId, "2026-03-28", "2026-03-28", MANAGER_USER_ID),
            );

            expect(entries.length).toBeGreaterThanOrEqual(1);
        });

        it("throws WorkingHoursNotOwnedError when worker views another's hours", async () => {
            const otherEmployeeId = randomUUID();

            await expect(
                queryBus.execute(
                    new GetEmployeeWorkingHoursQuery(otherEmployeeId, "2026-03-28", "2026-03-28", workerUserId),
                ),
            ).rejects.toThrow(WorkingHoursNotOwnedError);
        });
    });

    // ─── Edit Working Hours ──────────────────────────────────

    describe("Edit Working Hours", () => {
        it("worker edits own open entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-03-27",
                    hours: 4,
                }),
            );

            await commandBus.execute(new EditWorkingHoursCommand({ entryId, actorId: workerUserId, hours: 6 }));

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(workerEmployeeId, "2026-03-27", "2026-03-27", workerUserId),
            );

            const edited = entries.find((e) => e.id === entryId);
            expect(edited!.hours).toBe(6);
        });

        it("worker cannot edit locked entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-03-25",
                    hours: 4,
                }),
            );

            await commandBus.execute(
                new LockWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    dateFrom: "2026-03-25",
                    dateTo: "2026-03-25",
                    actorId: MANAGER_USER_ID,
                }),
            );

            await expect(
                commandBus.execute(new EditWorkingHoursCommand({ entryId, actorId: workerUserId, hours: 8 })),
            ).rejects.toThrow(WorkingHoursEntryLockedError);
        });

        it("manager can edit locked entry via forceEdit", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-03-24",
                    hours: 4,
                }),
            );

            await commandBus.execute(
                new LockWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    dateFrom: "2026-03-24",
                    dateTo: "2026-03-24",
                    actorId: MANAGER_USER_ID,
                }),
            );

            await commandBus.execute(new EditWorkingHoursCommand({ entryId, actorId: MANAGER_USER_ID, hours: 10 }));

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(workerEmployeeId, "2026-03-24", "2026-03-24", MANAGER_USER_ID),
            );

            const edited = entries.find((e) => e.id === entryId);
            expect(edited!.hours).toBe(10);
        });

        it("throws WorkingHoursNotOwnedError when worker edits another's entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: MANAGER_USER_ID,
                    date: "2026-03-23",
                    hours: 3,
                }),
            );

            const otherUserId = `other-user-${randomUUID().slice(0, 8)}`;
            await expect(
                commandBus.execute(new EditWorkingHoursCommand({ entryId, actorId: otherUserId, hours: 5 })),
            ).rejects.toThrow(WorkingHoursNotOwnedError);
        });

        it("throws WorkingHoursEntryNotFoundError for non-existent entry", async () => {
            await expect(
                commandBus.execute(
                    new EditWorkingHoursCommand({ entryId: randomUUID(), actorId: workerUserId, hours: 5 }),
                ),
            ).rejects.toThrow(WorkingHoursEntryNotFoundError);
        });
    });

    // ─── Delete Working Hours ─────────────────────────────────

    describe("Delete Working Hours", () => {
        it("worker deletes own open entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-05-01",
                    hours: 3,
                }),
            );

            await commandBus.execute(new DeleteWorkingHoursCommand({ entryId, actorId: workerUserId }));

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(workerEmployeeId, "2026-05-01", "2026-05-01", workerUserId),
            );
            expect(entries.find((e) => e.id === entryId)).toBeUndefined();
        });

        it("worker cannot delete locked entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-05-02",
                    hours: 4,
                }),
            );

            await commandBus.execute(
                new LockWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    dateFrom: "2026-05-02",
                    dateTo: "2026-05-02",
                    actorId: MANAGER_USER_ID,
                }),
            );

            await expect(
                commandBus.execute(new DeleteWorkingHoursCommand({ entryId, actorId: workerUserId })),
            ).rejects.toThrow(WorkingHoursEntryLockedError);
        });

        it("manager can delete locked entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-05-03",
                    hours: 2,
                }),
            );

            await commandBus.execute(
                new LockWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    dateFrom: "2026-05-03",
                    dateTo: "2026-05-03",
                    actorId: MANAGER_USER_ID,
                }),
            );

            await commandBus.execute(new DeleteWorkingHoursCommand({ entryId, actorId: MANAGER_USER_ID }));

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(workerEmployeeId, "2026-05-03", "2026-05-03", MANAGER_USER_ID),
            );
            expect(entries.find((e) => e.id === entryId)).toBeUndefined();
        });

        it("throws WorkingHoursNotOwnedError when worker deletes another's entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: MANAGER_USER_ID,
                    date: "2026-05-04",
                    hours: 3,
                }),
            );

            const otherUserId = `other-${randomUUID().slice(0, 8)}`;
            await expect(
                commandBus.execute(new DeleteWorkingHoursCommand({ entryId, actorId: otherUserId })),
            ).rejects.toThrow(WorkingHoursNotOwnedError);
        });
    });

    // ─── Lock Working Hours ──────────────────────────────────

    describe("Lock Working Hours", () => {
        it("manager locks entries in a date range", async () => {
            const empId = workerEmployeeId;

            await commandBus.execute(
                new LogWorkingHoursCommand({ employeeId: empId, actorId: workerUserId, date: "2026-03-20", hours: 4 }),
            );
            await commandBus.execute(
                new LogWorkingHoursCommand({ employeeId: empId, actorId: workerUserId, date: "2026-03-21", hours: 5 }),
            );

            await commandBus.execute(
                new LockWorkingHoursCommand({
                    employeeId: empId,
                    dateFrom: "2026-03-20",
                    dateTo: "2026-03-21",
                    actorId: MANAGER_USER_ID,
                }),
            );

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(empId, "2026-03-20", "2026-03-21", MANAGER_USER_ID),
            );

            expect(entries).toHaveLength(2);
            expect(entries.every((e) => e.status === (WorkingHoursStatus.LOCKED as string))).toBe(true);
            expect(entries.every((e) => e.lockedBy === MANAGER_USER_ID)).toBe(true);
        });

        it("non-manager cannot lock hours", async () => {
            await expect(
                commandBus.execute(
                    new LockWorkingHoursCommand({
                        employeeId: workerEmployeeId,
                        dateFrom: "2026-06-01",
                        dateTo: "2026-06-30",
                        actorId: workerUserId,
                    }),
                ),
            ).rejects.toThrow(WorkingHoursNotOwnedError);
        });
    });

    // ─── Delete Activity ─────────────────────────────────────

    describe("Delete Activity", () => {
        it("deletes an activity not assigned to any working hours", async () => {
            const activityId: string = await commandBus.execute(
                new CreateActivityCommand({ name: "Deletable activity" }),
            );

            await commandBus.execute(new DeleteActivityCommand({ activityId }));

            const activities: ListActivitiesResponse = await queryBus.execute(new ListActivitiesQuery());
            expect(activities.find((a) => a.id === activityId)).toBeUndefined();
        });

        it("throws ActivityNotFoundError for non-existent activity", async () => {
            await expect(commandBus.execute(new DeleteActivityCommand({ activityId: randomUUID() }))).rejects.toThrow(
                ActivityNotFoundError,
            );
        });

        it("throws ActivityInUseError when activity is assigned to working hours", async () => {
            const activityId: string = await commandBus.execute(new CreateActivityCommand({ name: "In-use activity" }));

            await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-05-10",
                    hours: 2,
                    activityId,
                }),
            );

            await expect(commandBus.execute(new DeleteActivityCommand({ activityId }))).rejects.toThrow(
                ActivityInUseError,
            );
        });
    });

    // ─── Activity Log ────────────────────────────────────────

    describe("Activity Log", () => {
        it("logs and queries activity log entries", async () => {
            const empId = randomUUID();
            const logService = moduleRef.get(ActivityLogService);

            await logService.log(empId, "visit-completed", "Completed visit at Customer X");
            await logService.log(empId, "payment-collected", "Collected 500 PLN");

            const entries: GetEmployeeActivityLogResponse = await queryBus.execute(
                new GetEmployeeActivityLogQuery(empId, "2026-03-01", "2026-12-31"),
            );

            expect(entries).toHaveLength(2);
            expect(entries[0].action).toBe("payment-collected");
            expect(entries[1].action).toBe("visit-completed");
        });

        it("cleanup cron deletes old entries", async () => {
            const empId = randomUUID();
            const logService = moduleRef.get(ActivityLogService);
            const cleanupCron = moduleRef.get(ActivityLogCleanupCron);

            await logService.log(empId, "old-action", "This is old");

            const connection = orm.em.getConnection();
            await connection.execute(
                `UPDATE "activity_log_entry" SET "occurred_at" = NOW() - INTERVAL '10 days' WHERE "employee_id" = ?`,
                [empId],
            );

            await cleanupCron.cleanup();

            const entries: GetEmployeeActivityLogResponse = await queryBus.execute(
                new GetEmployeeActivityLogQuery(empId, "2020-01-01", "2030-12-31"),
            );
            expect(entries).toHaveLength(0);
        });
    });

    // ─── Query Working Hours ─────────────────────────────────

    describe("Query Working Hours", () => {
        it("returns entries filtered by date range", async () => {
            await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-04-01",
                    hours: 3,
                }),
            );
            await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-04-02",
                    hours: 5,
                }),
            );
            await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId: workerEmployeeId,
                    actorId: workerUserId,
                    date: "2026-04-10",
                    hours: 2,
                }),
            );

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(workerEmployeeId, "2026-04-01", "2026-04-05", workerUserId),
            );

            expect(entries).toHaveLength(2);
            expect(entries[0].date).toBe("2026-04-01");
            expect(entries[1].date).toBe("2026-04-02");
        });
    });
});
