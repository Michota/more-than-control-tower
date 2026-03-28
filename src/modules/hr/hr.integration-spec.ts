import { MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../shared/queries/get-employee.query";
import {
    FindEmployeesByPermissionQuery,
    FindEmployeesByPermissionResponse,
} from "../../shared/queries/find-employees-by-permission.query";
import { CreateEmployeeCommand } from "./commands/create-employee/create-employee.command";
import { UpdateEmployeeCommand } from "./commands/update-employee/update-employee.command";
import { AssignPositionCommand } from "./commands/assign-position/assign-position.command";
import { UnassignPositionCommand } from "./commands/unassign-position/unassign-position.command";
import { DeactivateEmployeeCommand } from "./commands/deactivate-employee/deactivate-employee.command";
import { DeleteEmployeeCommand } from "./commands/delete-employee/delete-employee.command";
import { CreatePositionCommand } from "./commands/create-position/create-position.command";
import { UpdatePositionCommand } from "./commands/update-position/update-position.command";
import { SetPermissionOverrideCommand } from "./commands/set-permission-override/set-permission-override.command";
import { SetAvailabilityCommand } from "./commands/set-availability/set-availability.command";
import { ConfirmAvailabilityCommand } from "./commands/confirm-availability/confirm-availability.command";
import { RejectAvailabilityCommand } from "./commands/reject-availability/reject-availability.command";
import { PermissionOverrideState } from "./domain/permission-override-state.enum";
import { AvailabilityEntryStatus } from "./domain/availability-entry-status.enum";
import {
    EmployeeNotFoundError,
    InvalidPositionKeyError,
    PositionAlreadyAssignedError,
    PositionNotAssignedError,
    PositionKeyAlreadyExistsError,
    UnknownPermissionError,
} from "./domain/employee.errors";
import {
    AvailabilityAlreadyConfirmedError,
    AvailabilityLockedError,
    NoPendingAvailabilityError,
} from "./domain/availability-entry.errors";
import { ListPositionsQuery } from "./queries/list-positions/list-positions.query";
import { type ListPositionsResponse } from "./queries/list-positions/list-positions.query-handler";
import { GetEmployeeAvailabilityQuery } from "./queries/get-employee-availability/get-employee-availability.query";
import { type GetEmployeeAvailabilityResponse } from "./queries/get-employee-availability/get-employee-availability.query-handler";
import {
    CheckEmployeeAvailabilityQuery,
    type CheckEmployeeAvailabilityResponse,
} from "../../shared/queries/check-employee-availability.query";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry";
import { PermissionRegistryModule } from "../../shared/infrastructure/permission-registry.module";
import { HrModule } from "./hr.module";

describe("HR Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;
    let permissionRegistry: PermissionRegistry;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), PermissionRegistryModule, HrModule],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        queryBus = moduleRef.get(QueryBus);
        orm = moduleRef.get(MikroORM);
        permissionRegistry = moduleRef.get(PERMISSION_REGISTRY);

        await orm.schema.refresh();

        permissionRegistry.registerForModule("freight", [
            { key: "view-routes", name: "View Routes" },
            { key: "execute-route", name: "Execute Route" },
            { key: "drive-cat-c", name: "Drive Cat C" },
        ]);
        permissionRegistry.registerForModule("warehouse", [{ key: "create-receipt", name: "Create Receipt" }]);
    });

    afterAll(async () => {
        await orm.close(true);
        await moduleRef.close();
    });

    // ─── Helpers ───────────────────────────────────────────────

    let employeeCounter = 0;

    async function createEmployee(overrides: Partial<CreateEmployeeCommand> = {}): Promise<string> {
        employeeCounter++;
        return commandBus.execute(
            new CreateEmployeeCommand({
                firstName: overrides.firstName ?? "Jan",
                lastName: overrides.lastName ?? "Kowalski",
                email: overrides.email ?? `employee-${employeeCounter}@example.com`,
                phone: overrides.phone ?? `+4800000${String(employeeCounter).padStart(4, "0")}`,
                skipUniquenessCheck: overrides.skipUniquenessCheck,
            }),
        );
    }

    async function getEmployee(id: string): Promise<GetEmployeeResponse | null> {
        return queryBus.execute<GetEmployeeQuery, GetEmployeeResponse | null>(new GetEmployeeQuery(id));
    }

    async function ensurePosition(key: string, displayName: string, permissionKeys: string[] = []): Promise<string> {
        try {
            return await commandBus.execute(new CreatePositionCommand({ key, displayName, permissionKeys }));
        } catch {
            return "existing";
        }
    }

    // ─── Position CRUD ───────────────────────────────────────

    describe("Position Management", () => {
        it("creates a position and lists it", async () => {
            const positionId = await commandBus.execute(
                new CreatePositionCommand({
                    key: "test:position-crud",
                    displayName: "Test Position",
                    permissionKeys: [],
                }),
            );

            expect(positionId).toBeDefined();

            const result = await queryBus.execute<ListPositionsQuery, ListPositionsResponse>(new ListPositionsQuery());
            const found = result.positions.find((p) => p.key === "test:position-crud");
            expect(found).toBeDefined();
            expect(found!.displayName).toBe("Test Position");
        });

        it("creates a position with permissions", async () => {
            await commandBus.execute(
                new CreatePositionCommand({
                    key: "test:with-perms",
                    displayName: "With Perms",
                    permissionKeys: ["freight:view-routes", "freight:drive-cat-c"],
                }),
            );

            const result = await queryBus.execute<ListPositionsQuery, ListPositionsResponse>(new ListPositionsQuery());
            const found = result.positions.find((p) => p.key === "test:with-perms");
            expect(found!.permissionKeys).toEqual(["freight:view-routes", "freight:drive-cat-c"]);
        });

        it("rejects duplicate position key", async () => {
            await ensurePosition("test:dup-check", "First");

            await expect(
                commandBus.execute(
                    new CreatePositionCommand({ key: "test:dup-check", displayName: "Second", permissionKeys: [] }),
                ),
            ).rejects.toThrow(PositionKeyAlreadyExistsError);
        });

        it("rejects position with unknown permission key", async () => {
            await expect(
                commandBus.execute(
                    new CreatePositionCommand({
                        key: "test:bad-perms",
                        displayName: "Bad",
                        permissionKeys: ["fake:permission"],
                    }),
                ),
            ).rejects.toThrow(UnknownPermissionError);
        });

        it("updates a position", async () => {
            const positionId = await commandBus.execute(
                new CreatePositionCommand({ key: "test:updatable", displayName: "Before", permissionKeys: [] }),
            );

            await commandBus.execute(
                new UpdatePositionCommand({
                    positionId,
                    displayName: "After",
                    permissionKeys: ["freight:view-routes"],
                }),
            );

            const result = await queryBus.execute<ListPositionsQuery, ListPositionsResponse>(new ListPositionsQuery());
            const found = result.positions.find((p) => p.key === "test:updatable");
            expect(found!.displayName).toBe("After");
            expect(found!.permissionKeys).toEqual(["freight:view-routes"]);
        });
    });

    // ─── Employee CRUD ───────────────────────────────────────

    describe("Create Employee", () => {
        it("creates an employee and retrieves it", async () => {
            const id = await createEmployee();
            const employee = await getEmployee(id);

            expect(employee).not.toBeNull();
            expect(employee!.firstName).toBe("Jan");
            expect(employee!.status).toBe("active");
            expect(employee!.positionAssignments).toHaveLength(0);
        });

        it("creates an employee without optional fields", async () => {
            const id = await commandBus.execute(
                new CreateEmployeeCommand({ firstName: "Anna", lastName: "Nowak", skipUniquenessCheck: true }),
            );
            const employee = await getEmployee(id);

            expect(employee!.email).toBeUndefined();
            expect(employee!.phone).toBeUndefined();
        });
    });

    describe("Update Employee", () => {
        it("updates basic info", async () => {
            const id = await createEmployee();
            await commandBus.execute(new UpdateEmployeeCommand({ employeeId: id, firstName: "Adam" }));

            const employee = await getEmployee(id);
            expect(employee!.firstName).toBe("Adam");
        });

        it("throws EmployeeNotFoundError for non-existent employee", async () => {
            await expect(
                commandBus.execute(
                    new UpdateEmployeeCommand({
                        employeeId: "00000000-0000-0000-0000-000000000000",
                        firstName: "Ghost",
                    }),
                ),
            ).rejects.toThrow(EmployeeNotFoundError);
        });
    });

    // ─── Position Assignment ─────────────────────────────────

    describe("Assign Position", () => {
        beforeAll(async () => {
            await ensurePosition("freight:driver", "Driver", ["freight:view-routes", "freight:drive-cat-c"]);
            await ensurePosition("warehouse:worker", "Warehouse Worker", ["warehouse:create-receipt"]);
        });

        it("assigns a position to an employee", async () => {
            const id = await createEmployee();
            await commandBus.execute(
                new AssignPositionCommand({ employeeId: id, positionKey: "freight:driver", assignedBy: "test-admin" }),
            );

            const employee = await getEmployee(id);
            expect(employee!.positionAssignments).toHaveLength(1);
            expect(employee!.positionAssignments[0].positionKey).toBe("freight:driver");
        });

        it("assigns multiple positions", async () => {
            const id = await createEmployee();
            await commandBus.execute(
                new AssignPositionCommand({ employeeId: id, positionKey: "freight:driver", assignedBy: "test-admin" }),
            );
            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "warehouse:worker",
                    assignedBy: "test-admin",
                }),
            );

            const employee = await getEmployee(id);
            expect(employee!.positionAssignments).toHaveLength(2);
        });

        it("rejects assignment to non-existent position", async () => {
            const id = await createEmployee();

            await expect(
                commandBus.execute(
                    new AssignPositionCommand({
                        employeeId: id,
                        positionKey: "fake:position",
                        assignedBy: "test-admin",
                    }),
                ),
            ).rejects.toThrow(InvalidPositionKeyError);
        });

        it("throws PositionAlreadyAssignedError for duplicate", async () => {
            const id = await createEmployee();
            await commandBus.execute(
                new AssignPositionCommand({ employeeId: id, positionKey: "freight:driver", assignedBy: "test-admin" }),
            );

            await expect(
                commandBus.execute(
                    new AssignPositionCommand({
                        employeeId: id,
                        positionKey: "freight:driver",
                        assignedBy: "test-admin",
                    }),
                ),
            ).rejects.toThrow(PositionAlreadyAssignedError);
        });
    });

    describe("Unassign Position", () => {
        it("removes a position assignment", async () => {
            const id = await createEmployee();
            await ensurePosition("freight:driver", "Driver");
            await commandBus.execute(
                new AssignPositionCommand({ employeeId: id, positionKey: "freight:driver", assignedBy: "test-admin" }),
            );

            await commandBus.execute(new UnassignPositionCommand({ employeeId: id, positionKey: "freight:driver" }));

            const employee = await getEmployee(id);
            expect(employee!.positionAssignments).toHaveLength(0);
        });

        it("throws PositionNotAssignedError", async () => {
            const id = await createEmployee();

            await expect(
                commandBus.execute(new UnassignPositionCommand({ employeeId: id, positionKey: "freight:driver" })),
            ).rejects.toThrow(PositionNotAssignedError);
        });
    });

    // ─── Permission Overrides ────────────────────────────────

    describe("Permission Overrides", () => {
        it("sets permission overrides", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetPermissionOverrideCommand({
                    employeeId: id,
                    overrides: [
                        { permissionKey: "freight:view-routes", state: PermissionOverrideState.ALLOWED },
                        { permissionKey: "warehouse:create-receipt", state: PermissionOverrideState.DENIED },
                    ],
                }),
            );

            const employee = await getEmployee(id);
            expect(employee).not.toBeNull();
        });

        it("rejects override for unknown permission", async () => {
            const id = await createEmployee();

            await expect(
                commandBus.execute(
                    new SetPermissionOverrideCommand({
                        employeeId: id,
                        overrides: [{ permissionKey: "fake:permission", state: PermissionOverrideState.ALLOWED }],
                    }),
                ),
            ).rejects.toThrow(UnknownPermissionError);
        });

        it("allows removing an override", async () => {
            const id = await createEmployee();
            await commandBus.execute(
                new SetPermissionOverrideCommand({
                    employeeId: id,
                    overrides: [{ permissionKey: "freight:view-routes", state: PermissionOverrideState.ALLOWED }],
                }),
            );

            await commandBus.execute(
                new SetPermissionOverrideCommand({
                    employeeId: id,
                    overrides: [{ permissionKey: "freight:view-routes", state: null }],
                }),
            );

            const employee = await getEmployee(id);
            expect(employee).not.toBeNull();
        });
    });

    // ─── Deactivate + Delete ─────────────────────────────────

    describe("Deactivate Employee", () => {
        it("deactivates an employee", async () => {
            const id = await createEmployee();
            await commandBus.execute(new DeactivateEmployeeCommand({ employeeId: id }));

            const employee = await getEmployee(id);
            expect(employee!.status).toBe("inactive");
        });
    });

    describe("Delete Employee", () => {
        it("deletes an employee", async () => {
            const id = await createEmployee();
            await commandBus.execute(new DeleteEmployeeCommand({ employeeId: id }));

            const employee = await getEmployee(id);
            expect(employee).toBeNull();
        });

        it("throws EmployeeNotFoundError", async () => {
            await expect(
                commandBus.execute(new DeleteEmployeeCommand({ employeeId: "00000000-0000-0000-0000-000000000000" })),
            ).rejects.toThrow(EmployeeNotFoundError);
        });
    });

    // ─── Availability ────────────────────────────────────────

    describe("Set Availability", () => {
        it("sets availability entries for an employee (by employee → PENDING_APPROVAL)", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [
                        { date: "2026-04-01", startTime: "08:00", endTime: "16:00" },
                        { date: "2026-04-02", startTime: "09:00", endTime: "17:00" },
                    ],
                    setByManager: false,
                }),
            );

            const result = await queryBus.execute<GetEmployeeAvailabilityQuery, GetEmployeeAvailabilityResponse>(
                new GetEmployeeAvailabilityQuery(id),
            );

            expect(result.entries).toHaveLength(2);
            expect(result.entries[0].date).toBe("2026-04-01");
            expect(result.entries[0].status).toBe(AvailabilityEntryStatus.PENDING_APPROVAL);
            expect(result.entries[1].date).toBe("2026-04-02");
        });

        it("sets availability entries by manager → CONFIRMED", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-04-03", startTime: "08:00", endTime: "16:00" }],
                    setByManager: true,
                }),
            );

            const result = await queryBus.execute<GetEmployeeAvailabilityQuery, GetEmployeeAvailabilityResponse>(
                new GetEmployeeAvailabilityQuery(id),
            );

            expect(result.entries).toHaveLength(1);
            expect(result.entries[0].status).toBe(AvailabilityEntryStatus.CONFIRMED);
        });

        it("replaces existing entries for the same dates", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-04-05", startTime: "08:00", endTime: "12:00" }],
                    setByManager: false,
                }),
            );

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-04-05", startTime: "10:00", endTime: "18:00" }],
                    setByManager: false,
                }),
            );

            const result = await queryBus.execute<GetEmployeeAvailabilityQuery, GetEmployeeAvailabilityResponse>(
                new GetEmployeeAvailabilityQuery(id),
            );

            const april5 = result.entries.filter((e) => e.date === "2026-04-05");
            expect(april5).toHaveLength(1);
            expect(april5[0].startTime).toBe("10:00");
            expect(april5[0].endTime).toBe("18:00");
        });

        it("throws EmployeeNotFoundError for non-existent employee", async () => {
            await expect(
                commandBus.execute(
                    new SetAvailabilityCommand({
                        employeeId: "00000000-0000-0000-0000-000000000000",
                        entries: [{ date: "2026-04-01", startTime: "08:00", endTime: "16:00" }],
                        setByManager: false,
                    }),
                ),
            ).rejects.toThrow(EmployeeNotFoundError);
        });

        it("rejects employee editing locked (past) availability", async () => {
            const id = await createEmployee();

            // Set availability in the past (already locked)
            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2020-01-01", startTime: "08:00", endTime: "16:00" }],
                    setByManager: true,
                }),
            );

            // Employee tries to modify it → should fail
            await expect(
                commandBus.execute(
                    new SetAvailabilityCommand({
                        employeeId: id,
                        entries: [{ date: "2020-01-01", startTime: "10:00", endTime: "18:00" }],
                        setByManager: false,
                    }),
                ),
            ).rejects.toThrow(AvailabilityLockedError);
        });

        it("allows manager to edit locked (past) availability", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2020-02-01", startTime: "08:00", endTime: "16:00" }],
                    setByManager: true,
                }),
            );

            // Manager modifies locked entry → should succeed
            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2020-02-01", startTime: "10:00", endTime: "18:00" }],
                    setByManager: true,
                }),
            );

            const result = await queryBus.execute<GetEmployeeAvailabilityQuery, GetEmployeeAvailabilityResponse>(
                new GetEmployeeAvailabilityQuery(id, "2020-02-01", "2020-02-01"),
            );

            expect(result.entries).toHaveLength(1);
            expect(result.entries[0].startTime).toBe("10:00");
        });
    });

    describe("Confirm Availability", () => {
        it("confirms pending entries", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-05-01", startTime: "08:00", endTime: "16:00" }],
                    setByManager: false,
                }),
            );

            await commandBus.execute(new ConfirmAvailabilityCommand({ employeeId: id, dates: ["2026-05-01"] }));

            const result = await queryBus.execute<GetEmployeeAvailabilityQuery, GetEmployeeAvailabilityResponse>(
                new GetEmployeeAvailabilityQuery(id),
            );

            const may1 = result.entries.find((e) => e.date === "2026-05-01");
            expect(may1).toBeDefined();
            expect(may1!.status).toBe(AvailabilityEntryStatus.CONFIRMED);
        });

        it("throws when entries already confirmed", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-05-02", startTime: "08:00", endTime: "16:00" }],
                    setByManager: true,
                }),
            );

            await expect(
                commandBus.execute(new ConfirmAvailabilityCommand({ employeeId: id, dates: ["2026-05-02"] })),
            ).rejects.toThrow(AvailabilityAlreadyConfirmedError);
        });
    });

    describe("Reject Availability", () => {
        it("removes pending entries", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-06-01", startTime: "08:00", endTime: "16:00" }],
                    setByManager: false,
                }),
            );

            await commandBus.execute(new RejectAvailabilityCommand({ employeeId: id, dates: ["2026-06-01"] }));

            const result = await queryBus.execute<GetEmployeeAvailabilityQuery, GetEmployeeAvailabilityResponse>(
                new GetEmployeeAvailabilityQuery(id),
            );

            const june1 = result.entries.find((e) => e.date === "2026-06-01");
            expect(june1).toBeUndefined();
        });

        it("throws when trying to reject confirmed entries", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-06-02", startTime: "08:00", endTime: "16:00" }],
                    setByManager: true,
                }),
            );

            await expect(
                commandBus.execute(new RejectAvailabilityCommand({ employeeId: id, dates: ["2026-06-02"] })),
            ).rejects.toThrow(NoPendingAvailabilityError);
        });
    });

    describe("Query: GetEmployeeAvailability with date range", () => {
        it("filters by date range", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [
                        { date: "2026-07-01", startTime: "08:00", endTime: "16:00" },
                        { date: "2026-07-15", startTime: "08:00", endTime: "16:00" },
                        { date: "2026-08-01", startTime: "08:00", endTime: "16:00" },
                    ],
                    setByManager: true,
                }),
            );

            const result = await queryBus.execute<GetEmployeeAvailabilityQuery, GetEmployeeAvailabilityResponse>(
                new GetEmployeeAvailabilityQuery(id, "2026-07-01", "2026-07-31"),
            );

            expect(result.entries).toHaveLength(2);
            expect(result.entries.every((e) => e.date.startsWith("2026-07"))).toBe(true);
        });
    });

    describe("Cross-module: CheckEmployeeAvailability", () => {
        it("returns available=true for confirmed date", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-09-01", startTime: "08:00", endTime: "16:00" }],
                    setByManager: true,
                }),
            );

            const result = await queryBus.execute<CheckEmployeeAvailabilityQuery, CheckEmployeeAvailabilityResponse>(
                new CheckEmployeeAvailabilityQuery(id, "2026-09-01"),
            );

            expect(result.available).toBe(true);
        });

        it("returns available=false for pending date", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new SetAvailabilityCommand({
                    employeeId: id,
                    entries: [{ date: "2026-09-02", startTime: "08:00", endTime: "16:00" }],
                    setByManager: false,
                }),
            );

            const result = await queryBus.execute<CheckEmployeeAvailabilityQuery, CheckEmployeeAvailabilityResponse>(
                new CheckEmployeeAvailabilityQuery(id, "2026-09-02"),
            );

            expect(result.available).toBe(false);
        });

        it("returns available=false for date with no entries", async () => {
            const id = await createEmployee();

            const result = await queryBus.execute<CheckEmployeeAvailabilityQuery, CheckEmployeeAvailabilityResponse>(
                new CheckEmployeeAvailabilityQuery(id, "2026-09-03"),
            );

            expect(result.available).toBe(false);
            expect(result.reason).toBeDefined();
        });
    });

    // ─── Cross-module: Find by Permission ────────────────────

    describe("Find Employees by Permission", () => {
        beforeAll(async () => {
            await ensurePosition("freight:driver", "Driver", ["freight:view-routes", "freight:drive-cat-c"]);
        });

        it("finds employees who have a specific permission via their position", async () => {
            const id = await createEmployee({ firstName: "PermDriver", lastName: "Test" });
            await commandBus.execute(
                new AssignPositionCommand({ employeeId: id, positionKey: "freight:driver", assignedBy: "test-admin" }),
            );

            const result = await queryBus.execute<FindEmployeesByPermissionQuery, FindEmployeesByPermissionResponse>(
                new FindEmployeesByPermissionQuery("freight:drive-cat-c"),
            );

            const found = result.employees.find((e) => e.employeeId === id);
            expect(found).toBeDefined();
            expect(found!.firstName).toBe("PermDriver");
        });

        it("does not return employees without matching permission", async () => {
            const id = await createEmployee({ firstName: "NoMatch", lastName: "Test" });

            const result = await queryBus.execute<FindEmployeesByPermissionQuery, FindEmployeesByPermissionResponse>(
                new FindEmployeesByPermissionQuery("freight:drive-cat-c"),
            );

            const found = result.employees.find((e) => e.employeeId === id);
            expect(found).toBeUndefined();
        });
    });
});
