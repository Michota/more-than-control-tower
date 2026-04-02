import { generateEntityId } from "src/libs/ddd/utils/randomize-entity-id.js";
import { uuidRegex } from "src/shared/utils/uuid-regex.js";
import { ZodError } from "zod";
import { SystemUserRole } from "./system-user-role.enum.js";
import { SystemUserStatus } from "./system-user-status.enum.js";
import { SystemUserAggregate } from "./system-user.aggregate.js";
import { SystemUserCreatedDomainEvent } from "./events/system-user-created.domain-event.js";
import { SystemUserSuspendedDomainEvent } from "./events/system-user-suspended.domain-event.js";
import { CannotRemoveOwnAdminRoleError } from "./system-user.errors.js";

const validProps = () => ({
    email: "jan@example.com",
    name: "Jan Kowalski",
    roles: [SystemUserRole.USER],
});

describe("SystemUserAggregate.create()", () => {
    describe("happy path", () => {
        it("creates a user with UNACTIVATED status", () => {
            const user = SystemUserAggregate.create(validProps());

            expect(user.email).toBe("jan@example.com");
            expect(user.name).toBe("Jan Kowalski");
            expect(user.roles).toEqual([SystemUserRole.USER]);
            expect(user.status).toBe(SystemUserStatus.UNACTIVATED);
        });

        it("assigns a UUID id", () => {
            const user = SystemUserAggregate.create(validProps());

            expect(user.id).toMatch(uuidRegex);
        });

        it("emits a SystemUserCreatedDomainEvent", () => {
            const user = SystemUserAggregate.create(validProps());

            expect(user.domainEvents).toHaveLength(1);
            expect(user.domainEvents[0]).toBeInstanceOf(SystemUserCreatedDomainEvent);
            expect((user.domainEvents[0] as SystemUserCreatedDomainEvent).email).toBe("jan@example.com");
        });

        it("accepts multiple roles", () => {
            const user = SystemUserAggregate.create({
                ...validProps(),
                roles: [SystemUserRole.ADMINISTRATOR, SystemUserRole.MODERATOR],
            });

            expect(user.roles).toHaveLength(2);
        });
    });

    describe("validation", () => {
        it("throws when email is invalid", () => {
            expect(() => SystemUserAggregate.create({ ...validProps(), email: "not-an-email" })).toThrow(ZodError);
        });

        it("throws when name is empty", () => {
            expect(() => SystemUserAggregate.create({ ...validProps(), name: "" })).toThrow(ZodError);
        });

        it("throws when roles array is empty", () => {
            expect(() => SystemUserAggregate.create({ ...validProps(), roles: [] })).toThrow(ZodError);
        });
    });
});

describe("SystemUserAggregate.update()", () => {
    it("updates email", () => {
        const user = SystemUserAggregate.create(validProps());
        user.update({ email: "new@example.com" });

        expect(user.email).toBe("new@example.com");
    });

    it("updates name", () => {
        const user = SystemUserAggregate.create(validProps());
        user.update({ name: "Adam Nowak" });

        expect(user.name).toBe("Adam Nowak");
    });

    it("validates after update — throws on invalid email", () => {
        const user = SystemUserAggregate.create(validProps());

        expect(() => user.update({ email: "bad" })).toThrow(ZodError);
    });
});

describe("SystemUserAggregate.assignRoles()", () => {
    it("assigns new roles", () => {
        const user = SystemUserAggregate.create(validProps());
        user.assignRoles([SystemUserRole.MODERATOR, SystemUserRole.USER], "other-actor-id");

        expect(user.roles).toEqual([SystemUserRole.MODERATOR, SystemUserRole.USER]);
    });

    it("throws when admin tries to remove own admin role", () => {
        const user = SystemUserAggregate.create({
            ...validProps(),
            roles: [SystemUserRole.ADMINISTRATOR],
        });

        expect(() => user.assignRoles([SystemUserRole.USER], user.id)).toThrow(CannotRemoveOwnAdminRoleError);
    });

    it("allows admin to keep admin role while changing other roles", () => {
        const user = SystemUserAggregate.create({
            ...validProps(),
            roles: [SystemUserRole.ADMINISTRATOR, SystemUserRole.MODERATOR],
        });

        user.assignRoles([SystemUserRole.ADMINISTRATOR, SystemUserRole.USER], user.id);

        expect(user.roles).toEqual([SystemUserRole.ADMINISTRATOR, SystemUserRole.USER]);
    });

    it("allows another actor to remove admin role from a user", () => {
        const user = SystemUserAggregate.create({
            ...validProps(),
            roles: [SystemUserRole.ADMINISTRATOR],
        });

        user.assignRoles([SystemUserRole.USER], "different-actor-id");

        expect(user.roles).toEqual([SystemUserRole.USER]);
    });

    it("throws when assigning empty roles", () => {
        const user = SystemUserAggregate.create(validProps());

        expect(() => user.assignRoles([], "other-actor-id")).toThrow(ZodError);
    });
});

describe("SystemUserAggregate.suspend()", () => {
    it("sets status to SUSPENDED", () => {
        const user = SystemUserAggregate.create(validProps());
        user.suspend();

        expect(user.status).toBe(SystemUserStatus.SUSPENDED);
    });

    it("emits a SystemUserSuspendedDomainEvent", () => {
        const user = SystemUserAggregate.create(validProps());
        user.clearEvents();
        user.suspend();

        expect(user.domainEvents).toHaveLength(1);
        expect(user.domainEvents[0]).toBeInstanceOf(SystemUserSuspendedDomainEvent);
    });
});

describe("SystemUserAggregate.activate()", () => {
    it("sets status to ACTIVATED", () => {
        const user = SystemUserAggregate.create(validProps());
        user.activate();

        expect(user.status).toBe(SystemUserStatus.ACTIVATED);
    });
});

describe("SystemUserAggregate.reconstitute()", () => {
    it("reconstructs a user with all properties", () => {
        const user = SystemUserAggregate.reconstitute({
            id: generateEntityId("123e4567-e89b-12d3-a456-426614174000"),
            properties: {
                email: "admin@example.com",
                name: "Admin User",
                roles: [SystemUserRole.ADMINISTRATOR],
                status: SystemUserStatus.ACTIVATED,
            },
        });

        expect(user.id).toBe("123e4567-e89b-12d3-a456-426614174000");
        expect(user.email).toBe("admin@example.com");
        expect(user.status).toBe(SystemUserStatus.ACTIVATED);
    });
});
