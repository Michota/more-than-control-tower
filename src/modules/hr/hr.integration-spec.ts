import { MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../shared/queries/get-employee.query";
import {
    FindEmployeesByQualificationQuery,
    FindEmployeesByQualificationResponse,
} from "../../shared/queries/find-employees-by-qualification.query";
import { CreateEmployeeCommand } from "./commands/create-employee/create-employee.command";
import { UpdateEmployeeCommand } from "./commands/update-employee/update-employee.command";
import { AssignPositionCommand } from "./commands/assign-position/assign-position.command";
import { UnassignPositionCommand } from "./commands/unassign-position/unassign-position.command";
import { DeactivateEmployeeCommand } from "./commands/deactivate-employee/deactivate-employee.command";
import { DeleteEmployeeCommand } from "./commands/delete-employee/delete-employee.command";
import { CreatePositionCommand } from "./commands/create-position/create-position.command";
import { UpdatePositionCommand } from "./commands/update-position/update-position.command";
import { SetPermissionOverrideCommand } from "./commands/set-permission-override/set-permission-override.command";
import { PermissionOverrideState } from "./domain/permission-override-state.enum";
import {
    EmployeeNotFoundError,
    InvalidPositionKeyError,
    InvalidQualificationError,
    PositionAlreadyAssignedError,
    PositionNotAssignedError,
    PositionKeyAlreadyExistsError,
    UnknownPermissionError,
} from "./domain/employee.errors";
import { ListPositionsQuery } from "./queries/list-positions/list-positions.query";
import { type ListPositionsResponse } from "./queries/list-positions/list-positions.query-handler";
import { PERMISSION_REGISTRY, PermissionRegistry } from "../../shared/infrastructure/permission-registry";
import { HrModule } from "./hr.module";

describe("HR Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;
    let permissionRegistry: PermissionRegistry;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), HrModule],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        queryBus = moduleRef.get(QueryBus);
        orm = moduleRef.get(MikroORM);
        permissionRegistry = moduleRef.get(PERMISSION_REGISTRY);

        await orm.schema.refresh();

        // Simulate modules registering their permissions at startup
        permissionRegistry.registerMany([
            { key: "freight:view-routes", name: "View Routes", module: "freight", description: "View delivery routes" },
            { key: "freight:execute-route", name: "Execute Route", module: "freight", description: "Execute a route" },
            {
                key: "warehouse:create-receipt",
                name: "Create Receipt",
                module: "warehouse",
                description: "Create goods receipt",
            },
            { key: "warehouse:view-stock", name: "View Stock", module: "warehouse", description: "View stock levels" },
        ]);
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

    async function ensurePosition(
        key: string,
        displayName: string,
        qualificationSchema: CreatePositionCommand["qualificationSchema"] = [],
        permissionKeys: string[] = [],
    ): Promise<string> {
        try {
            return await commandBus.execute(
                new CreatePositionCommand({ key, displayName, qualificationSchema, permissionKeys }),
            );
        } catch {
            // Position already exists from a previous test — that's fine
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
                    qualificationSchema: [],
                    permissionKeys: [],
                }),
            );

            expect(positionId).toBeDefined();

            const result = await queryBus.execute<ListPositionsQuery, ListPositionsResponse>(new ListPositionsQuery());
            const found = result.positions.find((p) => p.key === "test:position-crud");
            expect(found).toBeDefined();
            expect(found!.displayName).toBe("Test Position");
        });

        it("creates a position with qualifications and permissions", async () => {
            await commandBus.execute(
                new CreatePositionCommand({
                    key: "test:qualified",
                    displayName: "Qualified Position",
                    qualificationSchema: [{ key: "level", type: "STRING", description: "Skill level", required: true }],
                    permissionKeys: ["freight:view-routes"],
                }),
            );

            const result = await queryBus.execute<ListPositionsQuery, ListPositionsResponse>(new ListPositionsQuery());
            const found = result.positions.find((p) => p.key === "test:qualified");
            expect(found!.qualificationSchema).toHaveLength(1);
            expect(found!.permissionKeys).toEqual(["freight:view-routes"]);
        });

        it("rejects duplicate position key", async () => {
            await ensurePosition("test:duplicate-check", "First");

            await expect(
                commandBus.execute(
                    new CreatePositionCommand({
                        key: "test:duplicate-check",
                        displayName: "Second",
                        qualificationSchema: [],
                        permissionKeys: [],
                    }),
                ),
            ).rejects.toThrow(PositionKeyAlreadyExistsError);
        });

        it("rejects position with unknown permission key", async () => {
            await expect(
                commandBus.execute(
                    new CreatePositionCommand({
                        key: "test:bad-perms",
                        displayName: "Bad Perms",
                        qualificationSchema: [],
                        permissionKeys: ["nonexistent:permission"],
                    }),
                ),
            ).rejects.toThrow(UnknownPermissionError);
        });

        it("updates a position", async () => {
            const positionId = await commandBus.execute(
                new CreatePositionCommand({
                    key: "test:updatable",
                    displayName: "Before Update",
                    qualificationSchema: [],
                    permissionKeys: [],
                }),
            );

            await commandBus.execute(
                new UpdatePositionCommand({
                    positionId,
                    displayName: "After Update",
                    permissionKeys: ["freight:view-routes"],
                }),
            );

            const result = await queryBus.execute<ListPositionsQuery, ListPositionsResponse>(new ListPositionsQuery());
            const found = result.positions.find((p) => p.key === "test:updatable");
            expect(found!.displayName).toBe("After Update");
            expect(found!.permissionKeys).toEqual(["freight:view-routes"]);
        });
    });

    // ─── Create Employee ─────────────────────────────────────

    describe("Create Employee", () => {
        it("creates an employee and retrieves it", async () => {
            const id = await createEmployee();
            const employee = await getEmployee(id);

            expect(employee).not.toBeNull();
            expect(employee!.firstName).toBe("Jan");
            expect(employee!.lastName).toBe("Kowalski");
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
            expect(employee!.userId).toBeUndefined();
        });
    });

    // ─── Update Employee ─────────────────────────────────────

    describe("Update Employee", () => {
        it("updates basic info", async () => {
            const id = await createEmployee();

            await commandBus.execute(new UpdateEmployeeCommand({ employeeId: id, firstName: "Adam" }));

            const employee = await getEmployee(id);
            expect(employee!.firstName).toBe("Adam");
            expect(employee!.lastName).toBe("Kowalski");
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
            await ensurePosition("freight:driver", "Driver", [
                { key: "licenseCategory", type: "STRING", description: "License category", required: true },
            ]);
            await ensurePosition("warehouse:worker", "Warehouse Worker", [
                { key: "productHandling", type: "STRING_ARRAY", description: "Products" },
            ]);
        });

        it("assigns a position with qualifications", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "freight:driver",
                    qualifications: [{ key: "licenseCategory", type: "STRING", value: "C" }],
                }),
            );

            const employee = await getEmployee(id);
            expect(employee!.positionAssignments).toHaveLength(1);
            expect(employee!.positionAssignments[0].positionKey).toBe("freight:driver");
            expect(employee!.positionAssignments[0].qualifications[0].value).toBe("C");
        });

        it("assigns multiple positions", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "freight:driver",
                    qualifications: [{ key: "licenseCategory", type: "STRING", value: "C" }],
                }),
            );
            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "warehouse:worker",
                    qualifications: [],
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
                        qualifications: [],
                    }),
                ),
            ).rejects.toThrow(InvalidPositionKeyError);
        });

        it("rejects when required qualification is missing", async () => {
            const id = await createEmployee();

            await expect(
                commandBus.execute(
                    new AssignPositionCommand({
                        employeeId: id,
                        positionKey: "freight:driver",
                        qualifications: [], // licenseCategory is required
                    }),
                ),
            ).rejects.toThrow(InvalidQualificationError);
        });

        it("rejects unknown qualification key", async () => {
            const id = await createEmployee();

            await expect(
                commandBus.execute(
                    new AssignPositionCommand({
                        employeeId: id,
                        positionKey: "freight:driver",
                        qualifications: [
                            { key: "licenseCategory", type: "STRING", value: "C" },
                            { key: "eyeColor", type: "STRING", value: "blue" },
                        ],
                    }),
                ),
            ).rejects.toThrow(InvalidQualificationError);
        });

        it("throws PositionAlreadyAssignedError for duplicate", async () => {
            const id = await createEmployee();
            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "freight:driver",
                    qualifications: [{ key: "licenseCategory", type: "STRING", value: "C" }],
                }),
            );

            await expect(
                commandBus.execute(
                    new AssignPositionCommand({
                        employeeId: id,
                        positionKey: "freight:driver",
                        qualifications: [{ key: "licenseCategory", type: "STRING", value: "B" }],
                    }),
                ),
            ).rejects.toThrow(PositionAlreadyAssignedError);
        });
    });

    describe("Unassign Position", () => {
        it("removes a position assignment", async () => {
            const id = await createEmployee();
            await ensurePosition("freight:driver", "Driver", [
                { key: "licenseCategory", type: "STRING", description: "License", required: true },
            ]);
            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "freight:driver",
                    qualifications: [{ key: "licenseCategory", type: "STRING", value: "C" }],
                }),
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
        it("sets permission overrides in batch", async () => {
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
            // Verify overrides persisted (check via aggregate properties in response)
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

        it("allows removing an override (state null)", async () => {
            const id = await createEmployee();

            // Set then remove
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

    // ─── Deactivate ──────────────────────────────────────────

    describe("Deactivate Employee", () => {
        it("deactivates an employee", async () => {
            const id = await createEmployee();

            await commandBus.execute(new DeactivateEmployeeCommand({ employeeId: id }));

            const employee = await getEmployee(id);
            expect(employee!.status).toBe("inactive");
        });
    });

    // ─── Delete Employee ─────────────────────────────────────

    describe("Delete Employee", () => {
        it("deletes an employee", async () => {
            const id = await createEmployee();

            await commandBus.execute(new DeleteEmployeeCommand({ employeeId: id }));

            const employee = await getEmployee(id);
            expect(employee).toBeNull();
        });

        it("throws EmployeeNotFoundError for non-existent employee", async () => {
            await expect(
                commandBus.execute(new DeleteEmployeeCommand({ employeeId: "00000000-0000-0000-0000-000000000000" })),
            ).rejects.toThrow(EmployeeNotFoundError);
        });
    });

    // ─── Cross-module Query: Find by Qualification ───────────

    describe("Find Employees by Qualification", () => {
        beforeAll(async () => {
            await ensurePosition("freight:driver", "Driver", [
                { key: "licenseCategory", type: "STRING", description: "License category", required: true },
            ]);
        });

        it("finds drivers with license category C", async () => {
            const id = await createEmployee({ firstName: "QualDriver", lastName: "C" });
            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "freight:driver",
                    qualifications: [{ key: "licenseCategory", type: "STRING", value: "C" }],
                }),
            );

            const result = await queryBus.execute<
                FindEmployeesByQualificationQuery,
                FindEmployeesByQualificationResponse
            >(
                new FindEmployeesByQualificationQuery("freight:driver", [
                    { key: "licenseCategory", operator: "eq", value: "C" },
                ]),
            );

            const found = result.employees.find((e) => e.employeeId === id);
            expect(found).toBeDefined();
            expect(found!.firstName).toBe("QualDriver");
        });

        it("does not return employees with different qualification value", async () => {
            const id = await createEmployee({ firstName: "QualDriver", lastName: "B" });
            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "freight:driver",
                    qualifications: [{ key: "licenseCategory", type: "STRING", value: "B" }],
                }),
            );

            const result = await queryBus.execute<
                FindEmployeesByQualificationQuery,
                FindEmployeesByQualificationResponse
            >(
                new FindEmployeesByQualificationQuery("freight:driver", [
                    { key: "licenseCategory", operator: "eq", value: "CE" },
                ]),
            );

            const found = result.employees.find((e) => e.employeeId === id);
            expect(found).toBeUndefined();
        });
    });
});
