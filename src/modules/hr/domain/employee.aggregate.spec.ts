import { generateEntityId } from "src/libs/ddd/utils/randomize-entity-id.js";
import { uuidRegex } from "src/shared/utils/uuid-regex.js";
import { ZodError } from "zod";
import { EmployeeStatus } from "./employee-status.enum.js";
import { PermissionOverrideState } from "./permission-override-state.enum.js";
import { PermissionOverride } from "./permission-override.value-object.js";
import { PositionAssignment } from "./position-assignment.value-object.js";
import { QualificationAttribute } from "./qualification-attribute.value-object.js";
import { EmployeeAggregate } from "./employee.aggregate.js";
import { EmployeeCreatedDomainEvent } from "./events/employee-created.domain-event.js";
import { EmployeeDeactivatedDomainEvent } from "./events/employee-deactivated.domain-event.js";
import { PositionAssignedDomainEvent } from "./events/position-assigned.domain-event.js";
import { PositionUnassignedDomainEvent } from "./events/position-unassigned.domain-event.js";
import { EmployeeLinkedToUserDomainEvent } from "./events/employee-linked-to-user.domain-event.js";
import {
    EmployeeAlreadyLinkedError,
    PositionAlreadyAssignedError,
    PositionNotAssignedError,
} from "./employee.errors.js";

const validProps = () => ({
    firstName: "Jan",
    lastName: "Kowalski",
    email: "jan@example.com",
    phone: "+48123456789",
});

const driverQualification = () => new QualificationAttribute({ key: "licenseCategory", type: "STRING", value: "C" });

const driverAssignment = () =>
    new PositionAssignment({
        positionKey: "freight:driver",
        assignedAt: new Date("2026-01-15"),
        qualifications: [driverQualification()],
    });

// --- helpers for qualification types ---
const stringQual = (key: string, value: string) => new QualificationAttribute({ key, type: "STRING", value });

const stringArrayQual = (key: string, values: string[]) =>
    new QualificationAttribute({ key, type: "STRING_ARRAY", value: JSON.stringify(values) });

describe("EmployeeAggregate.create()", () => {
    describe("happy path", () => {
        it("creates an active employee with generated UUID", () => {
            const employee = EmployeeAggregate.create(validProps());

            expect(employee.id).toMatch(uuidRegex);
            expect(employee.firstName).toBe("Jan");
            expect(employee.lastName).toBe("Kowalski");
            expect(employee.email).toBe("jan@example.com");
            expect(employee.status).toBe(EmployeeStatus.ACTIVE);
            expect(employee.positionAssignments).toHaveLength(0);
            expect(employee.permissionOverrides).toHaveLength(0);
        });

        it("creates an employee without userId", () => {
            const employee = EmployeeAggregate.create(validProps());

            expect(employee.userId).toBeUndefined();
        });

        it("creates an employee with userId", () => {
            const employee = EmployeeAggregate.create({ ...validProps(), userId: "user-123" });

            expect(employee.userId).toBe("user-123");
        });

        it("creates an employee without optional email and phone", () => {
            const employee = EmployeeAggregate.create({ firstName: "Jan", lastName: "Kowalski" });

            expect(employee.email).toBeUndefined();
            expect(employee.phone).toBeUndefined();
        });

        it("emits EmployeeCreatedDomainEvent", () => {
            const employee = EmployeeAggregate.create(validProps());

            expect(employee.domainEvents).toHaveLength(1);
            expect(employee.domainEvents[0]).toBeInstanceOf(EmployeeCreatedDomainEvent);

            const event = employee.domainEvents[0] as EmployeeCreatedDomainEvent;
            expect(event.firstName).toBe("Jan");
            expect(event.lastName).toBe("Kowalski");
        });
    });

    describe("validation", () => {
        it("throws when firstName is empty", () => {
            expect(() => EmployeeAggregate.create({ ...validProps(), firstName: "" })).toThrow(ZodError);
        });

        it("throws when lastName is empty", () => {
            expect(() => EmployeeAggregate.create({ ...validProps(), lastName: "" })).toThrow(ZodError);
        });

        it("throws when email is invalid", () => {
            expect(() => EmployeeAggregate.create({ ...validProps(), email: "not-an-email" })).toThrow(ZodError);
        });
    });
});

describe("EmployeeAggregate.linkToUser()", () => {
    it("links an employee to a user", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.linkToUser("user-456");

        expect(employee.userId).toBe("user-456");
    });

    it("emits EmployeeLinkedToUserDomainEvent", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.clearEvents();
        employee.linkToUser("user-456");

        expect(employee.domainEvents).toHaveLength(1);
        expect(employee.domainEvents[0]).toBeInstanceOf(EmployeeLinkedToUserDomainEvent);
        expect((employee.domainEvents[0] as EmployeeLinkedToUserDomainEvent).userId).toBe("user-456");
    });

    it("throws when already linked", () => {
        const employee = EmployeeAggregate.create({ ...validProps(), userId: "user-123" });

        expect(() => employee.linkToUser("user-456")).toThrow(EmployeeAlreadyLinkedError);
    });
});

describe("EmployeeAggregate position management", () => {
    describe("assignPosition()", () => {
        it("assigns a position with qualifications", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", [driverQualification()]);

            expect(employee.positionAssignments).toHaveLength(1);
            expect(employee.positionAssignments[0].positionKey).toBe("freight:driver");
            expect(employee.positionAssignments[0].qualifications).toHaveLength(1);
        });

        it("assigns a position without qualifications", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("crm:manager", []);

            expect(employee.positionAssignments).toHaveLength(1);
            expect(employee.positionAssignments[0].qualifications).toHaveLength(0);
        });

        it("allows multiple different positions", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", [driverQualification()]);
            employee.assignPosition("warehouse:worker", []);

            expect(employee.positionAssignments).toHaveLength(2);
        });

        it("emits PositionAssignedDomainEvent", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.clearEvents();
            employee.assignPosition("freight:driver", [driverQualification()]);

            expect(employee.domainEvents).toHaveLength(1);
            expect(employee.domainEvents[0]).toBeInstanceOf(PositionAssignedDomainEvent);
            expect((employee.domainEvents[0] as PositionAssignedDomainEvent).positionKey).toBe("freight:driver");
        });

        it("throws when position is already assigned", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", [driverQualification()]);

            expect(() => employee.assignPosition("freight:driver", [])).toThrow(PositionAlreadyAssignedError);
        });
    });

    describe("unassignPosition()", () => {
        it("removes a position assignment", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", [driverQualification()]);
            employee.clearEvents();

            employee.unassignPosition("freight:driver");

            expect(employee.positionAssignments).toHaveLength(0);
        });

        it("emits PositionUnassignedDomainEvent", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", []);
            employee.clearEvents();

            employee.unassignPosition("freight:driver");

            expect(employee.domainEvents).toHaveLength(1);
            expect(employee.domainEvents[0]).toBeInstanceOf(PositionUnassignedDomainEvent);
        });

        it("throws when position is not assigned", () => {
            const employee = EmployeeAggregate.create(validProps());

            expect(() => employee.unassignPosition("freight:driver")).toThrow(PositionNotAssignedError);
        });
    });

    describe("updateQualifications()", () => {
        it("updates qualifications for an existing position", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", [stringQual("licenseCategory", "B")]);

            employee.updateQualifications("freight:driver", [stringQual("licenseCategory", "C")]);

            expect(employee.positionAssignments[0].qualifications[0].value).toBe("C");
        });

        it("throws when position is not assigned", () => {
            const employee = EmployeeAggregate.create(validProps());

            expect(() => employee.updateQualifications("freight:driver", [])).toThrow(PositionNotAssignedError);
        });
    });

    describe("hasPosition()", () => {
        it("returns true for assigned position", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", []);

            expect(employee.hasPosition("freight:driver")).toBe(true);
        });

        it("returns false for unassigned position", () => {
            const employee = EmployeeAggregate.create(validProps());

            expect(employee.hasPosition("freight:driver")).toBe(false);
        });
    });

    describe("getQualification()", () => {
        it("returns qualification value", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", [stringQual("licenseCategory", "C")]);

            expect(employee.getQualification("freight:driver", "licenseCategory")).toBe("C");
        });

        it("returns undefined for missing position", () => {
            const employee = EmployeeAggregate.create(validProps());

            expect(employee.getQualification("freight:driver", "licenseCategory")).toBeUndefined();
        });

        it("returns undefined for missing qualification key", () => {
            const employee = EmployeeAggregate.create(validProps());
            employee.assignPosition("freight:driver", []);

            expect(employee.getQualification("freight:driver", "licenseCategory")).toBeUndefined();
        });
    });
});

describe("EmployeeAggregate status management", () => {
    it("deactivates an employee", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.clearEvents();

        employee.deactivate();

        expect(employee.status).toBe(EmployeeStatus.INACTIVE);
        expect(employee.domainEvents).toHaveLength(1);
        expect(employee.domainEvents[0]).toBeInstanceOf(EmployeeDeactivatedDomainEvent);
    });

    it("activates an inactive employee", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.deactivate();

        employee.activate();

        expect(employee.status).toBe(EmployeeStatus.ACTIVE);
    });
});

describe("EmployeeAggregate permission overrides", () => {
    it("sets an ALLOWED override", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.setPermissionOverride("warehouse:create-receipt", PermissionOverrideState.ALLOWED);

        expect(employee.permissionOverrides).toHaveLength(1);
        expect(employee.permissionOverrides[0].permissionKey).toBe("warehouse:create-receipt");
        expect(employee.permissionOverrides[0].state).toBe(PermissionOverrideState.ALLOWED);
    });

    it("overwrites an existing override", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.setPermissionOverride("warehouse:create-receipt", PermissionOverrideState.ALLOWED);
        employee.setPermissionOverride("warehouse:create-receipt", PermissionOverrideState.DENIED);

        expect(employee.permissionOverrides).toHaveLength(1);
        expect(employee.permissionOverrides[0].state).toBe(PermissionOverrideState.DENIED);
    });

    it("removes an override", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.setPermissionOverride("warehouse:create-receipt", PermissionOverrideState.ALLOWED);

        employee.removePermissionOverride("warehouse:create-receipt");

        expect(employee.permissionOverrides).toHaveLength(0);
    });

    it("removing a non-existent override is a no-op", () => {
        const employee = EmployeeAggregate.create(validProps());

        employee.removePermissionOverride("warehouse:create-receipt");

        expect(employee.permissionOverrides).toHaveLength(0);
    });
});

describe("EmployeeAggregate.getEffectivePermissions()", () => {
    const positionPermissions = new Map<string, readonly string[]>([
        ["freight:driver", ["freight:view-routes", "freight:execute-route"]],
        ["warehouse:worker", ["warehouse:create-receipt", "warehouse:view-stock"]],
    ]);

    it("returns empty permissions when no positions are assigned", () => {
        const employee = EmployeeAggregate.create(validProps());

        expect(employee.getEffectivePermissions(positionPermissions)).toEqual([]);
    });

    it("returns position-based permissions", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.assignPosition("freight:driver", []);

        const perms = employee.getEffectivePermissions(positionPermissions);

        expect(perms).toContain("freight:view-routes");
        expect(perms).toContain("freight:execute-route");
        expect(perms).toHaveLength(2);
    });

    it("merges permissions from multiple positions", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.assignPosition("freight:driver", []);
        employee.assignPosition("warehouse:worker", []);

        const perms = employee.getEffectivePermissions(positionPermissions);

        expect(perms).toHaveLength(4);
        expect(perms).toContain("freight:view-routes");
        expect(perms).toContain("warehouse:create-receipt");
    });

    it("ALLOWED override adds a permission not in position defaults", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.assignPosition("freight:driver", []);
        employee.setPermissionOverride("freight:plan-route", PermissionOverrideState.ALLOWED);

        const perms = employee.getEffectivePermissions(positionPermissions);

        expect(perms).toContain("freight:plan-route");
    });

    it("DENIED override removes a permission from position defaults", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.assignPosition("freight:driver", []);
        employee.setPermissionOverride("freight:execute-route", PermissionOverrideState.DENIED);

        const perms = employee.getEffectivePermissions(positionPermissions);

        expect(perms).toContain("freight:view-routes");
        expect(perms).not.toContain("freight:execute-route");
    });
});

describe("EmployeeAggregate.reconstitute()", () => {
    it("reconstructs an employee with all properties", () => {
        const employee = EmployeeAggregate.reconstitute({
            id: generateEntityId("emp-001"),
            properties: {
                userId: "user-123",
                firstName: "Jan",
                lastName: "Kowalski",
                email: "jan@example.com",
                phone: "+48123456789",
                status: EmployeeStatus.ACTIVE,
                positionAssignments: [driverAssignment()],
                permissionOverrides: [
                    new PermissionOverride({
                        permissionKey: "freight:plan-route",
                        state: PermissionOverrideState.ALLOWED,
                    }),
                ],
            },
        });

        expect(employee.id).toBe("emp-001");
        expect(employee.userId).toBe("user-123");
        expect(employee.positionAssignments).toHaveLength(1);
        expect(employee.permissionOverrides).toHaveLength(1);
        expect(employee.domainEvents).toHaveLength(0);
    });
});

describe("EmployeeAggregate.update()", () => {
    it("updates basic info", () => {
        const employee = EmployeeAggregate.create(validProps());
        employee.update({ firstName: "Adam", email: "adam@example.com" });

        expect(employee.firstName).toBe("Adam");
        expect(employee.email).toBe("adam@example.com");
        expect(employee.lastName).toBe("Kowalski");
    });

    it("validates after update", () => {
        const employee = EmployeeAggregate.create(validProps());

        expect(() => employee.update({ firstName: "" })).toThrow(ZodError);
    });
});

describe("PositionAssignment.hasQualification()", () => {
    it("matches exact STRING qualification", () => {
        const assignment = new PositionAssignment({
            positionKey: "freight:driver",
            assignedAt: new Date(),
            qualifications: [stringQual("licenseCategory", "C")],
        });

        expect(assignment.hasQualification("licenseCategory", "C")).toBe(true);
        expect(assignment.hasQualification("licenseCategory", "B")).toBe(false);
    });

    it("matches STRING_ARRAY qualification with contains", () => {
        const assignment = new PositionAssignment({
            positionKey: "warehouse:worker",
            assignedAt: new Date(),
            qualifications: [stringArrayQual("productHandling", ["product-xyz", "product-abc"])],
        });

        expect(assignment.hasQualification("productHandling", "product-xyz")).toBe(true);
        expect(assignment.hasQualification("productHandling", "product-unknown")).toBe(false);
    });

    it("returns false for missing key", () => {
        const assignment = new PositionAssignment({
            positionKey: "freight:driver",
            assignedAt: new Date(),
            qualifications: [],
        });

        expect(assignment.hasQualification("licenseCategory", "C")).toBe(false);
    });
});
