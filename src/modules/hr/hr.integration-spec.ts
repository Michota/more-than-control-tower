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
import { LinkEmployeeToUserCommand } from "./commands/link-employee-to-user/link-employee-to-user.command";
import { AssignPositionCommand } from "./commands/assign-position/assign-position.command";
import { UnassignPositionCommand } from "./commands/unassign-position/unassign-position.command";
import { DeactivateEmployeeCommand } from "./commands/deactivate-employee/deactivate-employee.command";
import {
    EmployeeNotFoundError,
    PositionAlreadyAssignedError,
    PositionNotAssignedError,
} from "./domain/employee.errors";
import { HrModule } from "./hr.module";

describe("HR Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), HrModule],
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

    // ─── Helpers ───────────────────────────────────────────────

    async function createEmployee(overrides: Partial<CreateEmployeeCommand> = {}): Promise<string> {
        return commandBus.execute(
            new CreateEmployeeCommand({
                firstName: overrides.firstName ?? "Jan",
                lastName: overrides.lastName ?? "Kowalski",
                email: overrides.email ?? "jan@example.com",
                phone: overrides.phone ?? "+48123456789",
                userId: overrides.userId,
            }),
        );
    }

    async function getEmployee(id: string): Promise<GetEmployeeResponse | null> {
        return queryBus.execute<GetEmployeeQuery, GetEmployeeResponse | null>(new GetEmployeeQuery(id));
    }

    // ─── Create ───────────────────────────────────────────────

    describe("Create Employee", () => {
        it("creates an employee and retrieves it", async () => {
            const id = await createEmployee();
            const employee = await getEmployee(id);

            expect(employee).not.toBeNull();
            expect(employee!.firstName).toBe("Jan");
            expect(employee!.lastName).toBe("Kowalski");
            expect(employee!.email).toBe("jan@example.com");
            expect(employee!.status).toBe("active");
            expect(employee!.positionAssignments).toHaveLength(0);
        });

        it("creates an employee without optional fields", async () => {
            const id = await commandBus.execute(new CreateEmployeeCommand({ firstName: "Anna", lastName: "Nowak" }));
            const employee = await getEmployee(id);

            expect(employee!.email).toBeUndefined();
            expect(employee!.phone).toBeUndefined();
            expect(employee!.userId).toBeUndefined();
        });

        it("creates an employee with userId", async () => {
            const id = await createEmployee({ userId: "user-abc" });
            const employee = await getEmployee(id);

            expect(employee!.userId).toBe("user-abc");
        });
    });

    // ─── Update ───────────────────────────────────────────────

    describe("Update Employee", () => {
        it("updates basic info", async () => {
            const id = await createEmployee();

            await commandBus.execute(
                new UpdateEmployeeCommand({
                    employeeId: id,
                    firstName: "Adam",
                    email: "adam@example.com",
                }),
            );

            const employee = await getEmployee(id);
            expect(employee!.firstName).toBe("Adam");
            expect(employee!.email).toBe("adam@example.com");
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

    // ─── Link to User ────────────────────────────────────────

    describe("Link Employee to User", () => {
        it("links an employee to a user", async () => {
            const id = await createEmployee();

            await commandBus.execute(new LinkEmployeeToUserCommand({ employeeId: id, userId: "user-link-test" }));

            const employee = await getEmployee(id);
            expect(employee!.userId).toBe("user-link-test");
        });
    });

    // ─── Position Assignment ─────────────────────────────────

    describe("Assign Position", () => {
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
            expect(employee!.positionAssignments[0].qualifications).toHaveLength(1);
            expect(employee!.positionAssignments[0].qualifications[0].key).toBe("licenseCategory");
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

        it("throws PositionAlreadyAssignedError for duplicate position", async () => {
            const id = await createEmployee();
            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "freight:driver",
                    qualifications: [],
                }),
            );

            await expect(
                commandBus.execute(
                    new AssignPositionCommand({
                        employeeId: id,
                        positionKey: "freight:driver",
                        qualifications: [],
                    }),
                ),
            ).rejects.toThrow(PositionAlreadyAssignedError);
        });
    });

    describe("Unassign Position", () => {
        it("removes a position assignment", async () => {
            const id = await createEmployee();
            await commandBus.execute(
                new AssignPositionCommand({
                    employeeId: id,
                    positionKey: "freight:driver",
                    qualifications: [],
                }),
            );

            await commandBus.execute(new UnassignPositionCommand({ employeeId: id, positionKey: "freight:driver" }));

            const employee = await getEmployee(id);
            expect(employee!.positionAssignments).toHaveLength(0);
        });

        it("throws PositionNotAssignedError for non-existent position", async () => {
            const id = await createEmployee();

            await expect(
                commandBus.execute(new UnassignPositionCommand({ employeeId: id, positionKey: "freight:driver" })),
            ).rejects.toThrow(PositionNotAssignedError);
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

    // ─── Cross-module Query: Find by Qualification ───────────

    describe("Find Employees by Qualification", () => {
        it("finds drivers with license category C", async () => {
            const id = await createEmployee({ firstName: "Driver", lastName: "One" });
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

            expect(result.employees.length).toBeGreaterThanOrEqual(1);
            const found = result.employees.find((e) => e.employeeId === id);
            expect(found).toBeDefined();
            expect(found!.firstName).toBe("Driver");
        });

        it("does not return employees with different qualification value", async () => {
            const id = await createEmployee({ firstName: "Driver", lastName: "B" });
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
