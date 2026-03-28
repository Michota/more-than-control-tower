import { randomUUID } from "crypto";
import { MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { PermissionRegistryModule } from "../../shared/infrastructure/permission-registry.module";
import { ErpModule } from "./erp.module";
import { CreateActivityCommand } from "./commands/create-activity/create-activity.command";
import { LogWorkingHoursCommand } from "./commands/log-working-hours/log-working-hours.command";
import { EditWorkingHoursCommand } from "./commands/edit-working-hours/edit-working-hours.command";
import { LockWorkingHoursCommand } from "./commands/lock-working-hours/lock-working-hours.command";
import { ListActivitiesQuery, type ListActivitiesResponse } from "./queries/list-activities/list-activities.query";
import {
    GetEmployeeWorkingHoursQuery,
    type GetEmployeeWorkingHoursResponse,
} from "./queries/get-employee-working-hours/get-employee-working-hours.query";
import { WorkingHoursStatus } from "./domain/working-hours-status.enum";
import { WorkingHoursEntryLockedError, WorkingHoursEntryNotFoundError } from "./domain/working-hours-entry.errors";
import { ActivityNotFoundError } from "./domain/activity.errors";

describe("ERP Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;

    const employeeId = randomUUID();
    const managerId = randomUUID();

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TestMikroOrmDatabaseModule(),
                CqrsModule.forRoot(),
                PermissionRegistryModule,
                ErpModule,
            ],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        queryBus = moduleRef.get(QueryBus);
        orm = moduleRef.get(MikroORM);

        await orm.schema.refresh();
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
            expect(created!.name).toBe("Warehouse work");
            expect(created!.description).toBeUndefined();
        });
    });

    // ─── Log Working Hours ───────────────────────────────────

    describe("Log Working Hours", () => {
        it("logs working hours without activity", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId,
                    date: "2026-03-28",
                    hours: 4,
                    note: "Morning shift",
                }),
            );

            expect(entryId).toBeDefined();

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(employeeId, "2026-03-28", "2026-03-28"),
            );

            const logged = entries.find((e) => e.id === entryId);
            expect(logged).toBeDefined();
            expect(logged!.hours).toBe(4);
            expect(logged!.note).toBe("Morning shift");
            expect(logged!.status).toBe(WorkingHoursStatus.OPEN as string);
        });

        it("logs working hours with activity", async () => {
            const activityId: string = await commandBus.execute(new CreateActivityCommand({ name: "Delivery run" }));

            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId,
                    date: "2026-03-28",
                    hours: 3,
                    activityId,
                }),
            );

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(employeeId, "2026-03-28", "2026-03-28"),
            );

            const logged = entries.find((e) => e.id === entryId);
            expect(logged!.activityId).toBe(activityId);
        });

        it("throws ActivityNotFoundError for non-existent activity", async () => {
            await expect(
                commandBus.execute(
                    new LogWorkingHoursCommand({
                        employeeId,
                        date: "2026-03-28",
                        hours: 2,
                        activityId: randomUUID(),
                    }),
                ),
            ).rejects.toThrow(ActivityNotFoundError);
        });
    });

    // ─── Edit Working Hours ──────────────────────────────────

    describe("Edit Working Hours", () => {
        it("edits hours on an open entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId,
                    date: "2026-03-27",
                    hours: 4,
                }),
            );

            await commandBus.execute(new EditWorkingHoursCommand({ entryId, hours: 6 }));

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(employeeId, "2026-03-27", "2026-03-27"),
            );

            const edited = entries.find((e) => e.id === entryId);
            expect(edited!.hours).toBe(6);
        });

        it("edits note on an open entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId,
                    date: "2026-03-26",
                    hours: 3,
                }),
            );

            await commandBus.execute(new EditWorkingHoursCommand({ entryId, note: "Added note" }));

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(employeeId, "2026-03-26", "2026-03-26"),
            );

            const edited = entries.find((e) => e.id === entryId);
            expect(edited!.note).toBe("Added note");
        });

        it("throws WorkingHoursEntryNotFoundError for non-existent entry", async () => {
            await expect(
                commandBus.execute(new EditWorkingHoursCommand({ entryId: randomUUID(), hours: 5 })),
            ).rejects.toThrow(WorkingHoursEntryNotFoundError);
        });

        it("throws WorkingHoursEntryLockedError when editing a locked entry", async () => {
            const entryId: string = await commandBus.execute(
                new LogWorkingHoursCommand({
                    employeeId,
                    date: "2026-03-25",
                    hours: 4,
                }),
            );

            await commandBus.execute(
                new LockWorkingHoursCommand({
                    employeeId,
                    dateFrom: "2026-03-25",
                    dateTo: "2026-03-25",
                    lockedBy: managerId,
                }),
            );

            await expect(commandBus.execute(new EditWorkingHoursCommand({ entryId, hours: 8 }))).rejects.toThrow(
                WorkingHoursEntryLockedError,
            );
        });
    });

    // ─── Lock Working Hours ──────────────────────────────────

    describe("Lock Working Hours", () => {
        it("locks all open entries in a date range", async () => {
            const empId = randomUUID();

            await commandBus.execute(new LogWorkingHoursCommand({ employeeId: empId, date: "2026-03-20", hours: 4 }));
            await commandBus.execute(new LogWorkingHoursCommand({ employeeId: empId, date: "2026-03-21", hours: 5 }));

            await commandBus.execute(
                new LockWorkingHoursCommand({
                    employeeId: empId,
                    dateFrom: "2026-03-20",
                    dateTo: "2026-03-21",
                    lockedBy: managerId,
                }),
            );

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(empId, "2026-03-20", "2026-03-21"),
            );

            expect(entries).toHaveLength(2);
            expect(entries.every((e) => e.status === (WorkingHoursStatus.LOCKED as string))).toBe(true);
            expect(entries.every((e) => e.lockedBy === managerId)).toBe(true);
        });

        it("does nothing when no open entries exist in range", async () => {
            await expect(
                commandBus.execute(
                    new LockWorkingHoursCommand({
                        employeeId: randomUUID(),
                        dateFrom: "2026-01-01",
                        dateTo: "2026-01-31",
                        lockedBy: managerId,
                    }),
                ),
            ).resolves.not.toThrow();
        });
    });

    // ─── Query Working Hours ─────────────────────────────────

    describe("Query Working Hours", () => {
        it("returns entries filtered by date range", async () => {
            const empId = randomUUID();

            await commandBus.execute(new LogWorkingHoursCommand({ employeeId: empId, date: "2026-04-01", hours: 3 }));
            await commandBus.execute(new LogWorkingHoursCommand({ employeeId: empId, date: "2026-04-02", hours: 5 }));
            await commandBus.execute(new LogWorkingHoursCommand({ employeeId: empId, date: "2026-04-10", hours: 2 }));

            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(empId, "2026-04-01", "2026-04-05"),
            );

            expect(entries).toHaveLength(2);
            expect(entries[0].date).toBe("2026-04-01");
            expect(entries[1].date).toBe("2026-04-02");
        });

        it("returns empty array for employee with no entries", async () => {
            const entries: GetEmployeeWorkingHoursResponse = await queryBus.execute(
                new GetEmployeeWorkingHoursQuery(randomUUID(), "2026-01-01", "2026-12-31"),
            );

            expect(entries).toHaveLength(0);
        });
    });
});
