import { MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../shared/queries/get-system-user.query";
import { CreateSystemUserCommand } from "./commands/create-system-user/create-system-user.command";
import { UpdateSystemUserCommand } from "./commands/update-system-user/update-system-user.command";
import { AssignRolesCommand } from "./commands/assign-roles/assign-roles.command";
import { SuspendSystemUserCommand } from "./commands/suspend-system-user/suspend-system-user.command";
import { ActivateSystemUserCommand } from "./commands/activate-system-user/activate-system-user.command";
import { SystemUserRole } from "./domain/system-user-role.enum";
import { SystemUserStatus } from "./domain/system-user-status.enum";
import {
    SystemUserNotFoundError,
    CannotRemoveOwnAdminRoleError,
    LastActiveAdminError,
} from "./domain/system-user.errors";
import { ListSystemUsersQuery, ListSystemUsersResponse } from "./queries/list-system-users/list-system-users.query";
import { SystemUser } from "./database/system-user.entity";
import { SystemModule } from "./system.module";

describe("System Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), SystemModule],
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

    let emailCounter = 0;

    function uniqueEmail(): string {
        return `user-${Date.now()}-${++emailCounter}@example.com`;
    }

    function createUserCmd(overrides: Partial<CreateSystemUserCommand> = {}) {
        return new CreateSystemUserCommand({
            email: overrides.email ?? uniqueEmail(),
            firstName: overrides.firstName ?? "Jan",
            lastName: overrides.lastName ?? "Kowalski",
            roles: overrides.roles ?? [SystemUserRole.USER],
        });
    }

    async function createUser(overrides: Partial<CreateSystemUserCommand> = {}): Promise<string> {
        return commandBus.execute(createUserCmd(overrides));
    }

    async function getUser(id: string): Promise<GetSystemUserResponse | null> {
        return queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(new GetSystemUserQuery(id));
    }

    async function listUsers(term?: string, page = 1, limit = 20): Promise<ListSystemUsersResponse> {
        return queryBus.execute(new ListSystemUsersQuery(term, page, limit));
    }

    // ─── Create ───────────────────────────────────────────────

    describe("Create System User", () => {
        it("creates a user with UNACTIVATED status and retrieves it", async () => {
            const email = uniqueEmail();
            const id = await createUser({ email });
            const user = await getUser(id);

            expect(user).not.toBeNull();
            expect(user!.email).toBe(email);
            expect(user!.firstName).toBe("Jan");
            expect(user!.lastName).toBe("Kowalski");
            expect(user!.roles).toEqual([SystemUserRole.USER]);
            expect(user!.status).toBe(SystemUserStatus.UNACTIVATED);
        });

        it("creates a user with multiple roles", async () => {
            const id = await createUser({ roles: [SystemUserRole.ADMINISTRATOR, SystemUserRole.MODERATOR] });
            const user = await getUser(id);

            expect(user!.roles).toEqual([SystemUserRole.ADMINISTRATOR, SystemUserRole.MODERATOR]);
        });

        it("returns a valid UUID as the user id", async () => {
            const id = await createUser();

            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        });
    });

    // ─── Update ───────────────────────────────────────────────

    describe("Update System User", () => {
        it("updates firstName and lastName", async () => {
            const id = await createUser();

            await commandBus.execute(new UpdateSystemUserCommand({ userId: id, firstName: "Adam", lastName: "Nowak" }));

            const user = await getUser(id);
            expect(user!.firstName).toBe("Adam");
            expect(user!.lastName).toBe("Nowak");
        });

        it("updates email", async () => {
            const id = await createUser();
            const newEmail = uniqueEmail();

            await commandBus.execute(new UpdateSystemUserCommand({ userId: id, email: newEmail }));

            const user = await getUser(id);
            expect(user!.email).toBe(newEmail);
        });

        it("partial update preserves unchanged fields", async () => {
            const email = uniqueEmail();
            const id = await createUser({ email, firstName: "Original", lastName: "Name" });

            await commandBus.execute(new UpdateSystemUserCommand({ userId: id, firstName: "Changed" }));

            const user = await getUser(id);
            expect(user!.firstName).toBe("Changed");
            expect(user!.lastName).toBe("Name");
            expect(user!.email).toBe(email);
        });

        it("throws SystemUserNotFoundError for non-existent user", async () => {
            await expect(
                commandBus.execute(
                    new UpdateSystemUserCommand({
                        userId: "00000000-0000-0000-0000-000000000000",
                        firstName: "Ghost",
                    }),
                ),
            ).rejects.toThrow(SystemUserNotFoundError);
        });
    });

    // ─── Assign Roles ────────────────────────────────────────

    describe("Assign Roles", () => {
        it("assigns new roles to a user", async () => {
            const id = await createUser();

            await commandBus.execute(
                new AssignRolesCommand({
                    userId: id,
                    roles: [SystemUserRole.MODERATOR, SystemUserRole.USER],
                    actorId: "other-actor",
                }),
            );

            const user = await getUser(id);
            expect(user!.roles).toEqual([SystemUserRole.MODERATOR, SystemUserRole.USER]);
        });

        it("replaces all existing roles (not appending)", async () => {
            // Ensure another admin exists so this one can lose admin role
            await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });

            const id = await createUser({
                roles: [SystemUserRole.ADMINISTRATOR, SystemUserRole.MODERATOR, SystemUserRole.USER],
            });

            await commandBus.execute(
                new AssignRolesCommand({
                    userId: id,
                    roles: [SystemUserRole.USER],
                    actorId: "other-actor",
                }),
            );

            const user = await getUser(id);
            expect(user!.roles).toEqual([SystemUserRole.USER]);
        });

        describe("last active admin protection", () => {
            beforeEach(async () => {
                await orm.em.nativeDelete(SystemUser, {});
            });

            it("prevents removing admin role from the last active admin", async () => {
                const id = await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });

                await expect(
                    commandBus.execute(
                        new AssignRolesCommand({
                            userId: id,
                            roles: [SystemUserRole.USER],
                            actorId: "different-actor",
                        }),
                    ),
                ).rejects.toThrow(LastActiveAdminError);

                const user = await getUser(id);
                expect(user!.roles).toEqual([SystemUserRole.ADMINISTRATOR]);
            });

            it("allows removing admin role when another active admin exists", async () => {
                await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });
                const id = await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });

                await commandBus.execute(
                    new AssignRolesCommand({
                        userId: id,
                        roles: [SystemUserRole.USER],
                        actorId: "different-actor",
                    }),
                );

                const user = await getUser(id);
                expect(user!.roles).toEqual([SystemUserRole.USER]);
            });
        });

        it("prevents admin from removing own admin role", async () => {
            const id = await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });

            await expect(
                commandBus.execute(
                    new AssignRolesCommand({
                        userId: id,
                        roles: [SystemUserRole.USER],
                        actorId: id,
                    }),
                ),
            ).rejects.toThrow(CannotRemoveOwnAdminRoleError);

            // Verify roles unchanged after failed attempt
            const user = await getUser(id);
            expect(user!.roles).toEqual([SystemUserRole.ADMINISTRATOR]);
        });

        it("allows admin to keep admin role while changing other roles", async () => {
            const id = await createUser({
                roles: [SystemUserRole.ADMINISTRATOR, SystemUserRole.MODERATOR],
            });

            await commandBus.execute(
                new AssignRolesCommand({
                    userId: id,
                    roles: [SystemUserRole.ADMINISTRATOR, SystemUserRole.USER],
                    actorId: id,
                }),
            );

            const user = await getUser(id);
            expect(user!.roles).toEqual([SystemUserRole.ADMINISTRATOR, SystemUserRole.USER]);
        });

        it("allows another actor to remove admin role from a user", async () => {
            const id = await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });

            await commandBus.execute(
                new AssignRolesCommand({
                    userId: id,
                    roles: [SystemUserRole.USER],
                    actorId: "different-actor",
                }),
            );

            const user = await getUser(id);
            expect(user!.roles).toEqual([SystemUserRole.USER]);
        });

        it("throws SystemUserNotFoundError for non-existent user", async () => {
            await expect(
                commandBus.execute(
                    new AssignRolesCommand({
                        userId: "00000000-0000-0000-0000-000000000000",
                        roles: [SystemUserRole.USER],
                        actorId: "actor",
                    }),
                ),
            ).rejects.toThrow(SystemUserNotFoundError);
        });
    });

    // ─── Suspend / Activate ──────────────────────────────────

    describe("Suspend and Activate", () => {
        it("suspends a user", async () => {
            const id = await createUser();

            await commandBus.execute(new SuspendSystemUserCommand({ userId: id }));

            const user = await getUser(id);
            expect(user!.status).toBe(SystemUserStatus.SUSPENDED);
        });

        it("activates an unactivated user", async () => {
            const id = await createUser();
            expect((await getUser(id))!.status).toBe(SystemUserStatus.UNACTIVATED);

            await commandBus.execute(new ActivateSystemUserCommand({ userId: id }));

            const user = await getUser(id);
            expect(user!.status).toBe(SystemUserStatus.ACTIVATED);
        });

        it("reactivates a suspended user", async () => {
            const id = await createUser();
            await commandBus.execute(new SuspendSystemUserCommand({ userId: id }));
            expect((await getUser(id))!.status).toBe(SystemUserStatus.SUSPENDED);

            await commandBus.execute(new ActivateSystemUserCommand({ userId: id }));

            const user = await getUser(id);
            expect(user!.status).toBe(SystemUserStatus.ACTIVATED);
        });

        describe("last active admin protection", () => {
            beforeEach(async () => {
                await orm.em.nativeDelete(SystemUser, {});
            });

            it("prevents suspending the last active admin", async () => {
                const id = await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });

                await expect(commandBus.execute(new SuspendSystemUserCommand({ userId: id }))).rejects.toThrow(
                    LastActiveAdminError,
                );

                const user = await getUser(id);
                expect(user!.status).toBe(SystemUserStatus.UNACTIVATED);
            });

            it("allows suspending an admin when another active admin exists", async () => {
                await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });
                const id = await createUser({ roles: [SystemUserRole.ADMINISTRATOR] });

                await commandBus.execute(new SuspendSystemUserCommand({ userId: id }));

                const user = await getUser(id);
                expect(user!.status).toBe(SystemUserStatus.SUSPENDED);
            });
        });

        it("throws SystemUserNotFoundError when suspending non-existent user", async () => {
            await expect(
                commandBus.execute(new SuspendSystemUserCommand({ userId: "00000000-0000-0000-0000-000000000000" })),
            ).rejects.toThrow(SystemUserNotFoundError);
        });

        it("throws SystemUserNotFoundError when activating non-existent user", async () => {
            await expect(
                commandBus.execute(new ActivateSystemUserCommand({ userId: "00000000-0000-0000-0000-000000000000" })),
            ).rejects.toThrow(SystemUserNotFoundError);
        });
    });

    // ─── List / Search ───────────────────────────────────────

    describe("List System Users", () => {
        it("returns a paginated result with correct metadata", async () => {
            await createUser();

            const result = await listUsers(undefined, 1, 5);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(5);
            expect(result.count).toBeGreaterThanOrEqual(1);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            expect(result.data.length).toBeLessThanOrEqual(5);
        });

        it("returns all expected fields in each list item", async () => {
            const email = uniqueEmail();
            await createUser({ email, firstName: "FieldCheck", roles: [SystemUserRole.MODERATOR] });

            const result = await listUsers("FieldCheck", 1, 10);

            expect(result.data).toHaveLength(1);
            const user = result.data[0];
            expect(user.id).toBeDefined();
            expect(user.email).toBe(email);
            expect(user.firstName).toBe("FieldCheck");
            expect(user.lastName).toBe("Kowalski");
            expect(user.roles).toEqual([SystemUserRole.MODERATOR]);
            expect(user.status).toBe(SystemUserStatus.UNACTIVATED);
        });

        it("paginates correctly across pages", async () => {
            const tag = `page-${Date.now()}`;
            await createUser({ firstName: tag, lastName: "A" });
            await createUser({ firstName: tag, lastName: "B" });
            await createUser({ firstName: tag, lastName: "C" });

            const page1 = await listUsers(tag, 1, 2);
            const page2 = await listUsers(tag, 2, 2);

            expect(page1.data).toHaveLength(2);
            expect(page2.data).toHaveLength(1);
            expect(page1.count).toBe(3);

            const allIds = [...page1.data, ...page2.data].map((u) => u.id);
            expect(new Set(allIds).size).toBe(3);
        });

        it("searches users by firstName", async () => {
            const uniqueName = `FirstSearch-${Date.now()}`;
            await createUser({ firstName: uniqueName });

            const result = await listUsers(uniqueName, 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].firstName).toBe(uniqueName);
        });

        it("searches users by lastName", async () => {
            const uniqueName = `LastSearch-${Date.now()}`;
            await createUser({ lastName: uniqueName });

            const result = await listUsers(uniqueName, 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].lastName).toBe(uniqueName);
        });

        it("searches users by email", async () => {
            const email = `searchemail-${Date.now()}@unique.com`;
            await createUser({ email });

            const result = await listUsers(email, 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].email).toBe(email);
        });

        it("search is case-insensitive", async () => {
            const uniqueName = `CaseTest-${Date.now()}`;
            await createUser({ firstName: uniqueName });

            const result = await listUsers(uniqueName.toLowerCase(), 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].firstName).toBe(uniqueName);
        });

        it("returns empty result for non-matching search", async () => {
            const result = await listUsers(`nonexistent-${Date.now()}`, 1, 10);

            expect(result.data).toHaveLength(0);
            expect(result.count).toBe(0);
        });

        it("lists without search term returns all users (paginated path)", async () => {
            const tag = `listall-${Date.now()}`;
            await createUser({ firstName: tag });

            const result = await listUsers(undefined, 1, 100);

            const found = result.data.find((u) => u.firstName === tag);
            expect(found).toBeDefined();
        });
    });

    // ─── Get System User (cross-module query) ────────────────

    describe("Get System User (shared query)", () => {
        it("returns the user by id", async () => {
            const email = uniqueEmail();
            const id = await createUser({ email });

            const user = await getUser(id);

            expect(user).not.toBeNull();
            expect(user!.id).toBe(id);
            expect(user!.email).toBe(email);
        });

        it("returns null for non-existent user", async () => {
            const user = await getUser("00000000-0000-0000-0000-000000000000");

            expect(user).toBeNull();
        });
    });

    // ─── Full lifecycle ──────────────────────────────────────

    describe("Full user lifecycle", () => {
        it("create → activate → update → assign roles → suspend", async () => {
            const email = uniqueEmail();
            const id = await createUser({ email, roles: [SystemUserRole.USER] });

            // Initially unactivated
            expect((await getUser(id))!.status).toBe(SystemUserStatus.UNACTIVATED);

            // Activate
            await commandBus.execute(new ActivateSystemUserCommand({ userId: id }));
            expect((await getUser(id))!.status).toBe(SystemUserStatus.ACTIVATED);

            // Update profile
            await commandBus.execute(
                new UpdateSystemUserCommand({ userId: id, firstName: "Updated", lastName: "User" }),
            );
            const updated = await getUser(id);
            expect(updated!.firstName).toBe("Updated");
            expect(updated!.lastName).toBe("User");
            expect(updated!.email).toBe(email);

            // Promote to moderator
            await commandBus.execute(
                new AssignRolesCommand({
                    userId: id,
                    roles: [SystemUserRole.MODERATOR, SystemUserRole.USER],
                    actorId: "admin-actor",
                }),
            );
            expect((await getUser(id))!.roles).toEqual([SystemUserRole.MODERATOR, SystemUserRole.USER]);

            // Suspend
            await commandBus.execute(new SuspendSystemUserCommand({ userId: id }));
            expect((await getUser(id))!.status).toBe(SystemUserStatus.SUSPENDED);

            // Verify searchable while suspended
            const searchResult = await listUsers(email, 1, 10);
            expect(searchResult.data).toHaveLength(1);
            expect(searchResult.data[0].status).toBe(SystemUserStatus.SUSPENDED);
        });
    });
});
