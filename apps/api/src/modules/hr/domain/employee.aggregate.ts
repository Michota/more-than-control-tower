import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import z from "zod";
import { EmployeeStatus } from "./employee-status.enum.js";
import { PositionAssignment } from "./position-assignment.value-object.js";
import { PermissionOverride } from "./permission-override.value-object.js";
import { PermissionOverrideState } from "./permission-override-state.enum.js";
import {
    EmployeeAlreadyLinkedError,
    PositionAlreadyAssignedError,
    PositionNotAssignedError,
} from "./employee.errors.js";
import { EmployeeCreatedDomainEvent } from "./events/employee-created.domain-event.js";
import { EmployeeDeactivatedDomainEvent } from "./events/employee-deactivated.domain-event.js";
import { PositionAssignedDomainEvent } from "./events/position-assigned.domain-event.js";
import { PositionUnassignedDomainEvent } from "./events/position-unassigned.domain-event.js";
import { EmployeeLinkedToUserDomainEvent } from "./events/employee-linked-to-user.domain-event.js";

const employeeSchema = z.object({
    userId: z.string().min(1).optional(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    status: z.enum(EmployeeStatus),
    positionAssignments: z.array(z.instanceof(PositionAssignment)),
    permissionOverrides: z.array(z.instanceof(PermissionOverride)),
});

export type EmployeeProperties = z.infer<typeof employeeSchema>;

export class EmployeeAggregate extends AggregateRoot<EmployeeProperties> {
    static create(
        properties: Omit<EmployeeProperties, "status" | "positionAssignments" | "permissionOverrides"> & {
            positionAssignments?: PositionAssignment[];
            permissionOverrides?: PermissionOverride[];
        },
    ): EmployeeAggregate {
        const employee = new EmployeeAggregate({
            properties: {
                ...properties,
                status: EmployeeStatus.ACTIVE,
                positionAssignments: properties.positionAssignments ?? [],
                permissionOverrides: properties.permissionOverrides ?? [],
            },
        });

        employee.validate();

        employee.addEvent(
            new EmployeeCreatedDomainEvent({
                aggregateId: employee.id,
                firstName: properties.firstName,
                lastName: properties.lastName,
            }),
        );

        return employee;
    }

    static reconstitute(props: EntityProps<EmployeeProperties>): EmployeeAggregate {
        return new EmployeeAggregate(props);
    }

    validate(): void {
        employeeSchema.parse(this.properties);
    }

    update(props: Partial<Pick<EmployeeProperties, "firstName" | "lastName" | "email" | "phone">>): void {
        Object.assign(this.properties, props);
        this.validate();
    }

    linkToUser(userId: string): void {
        if (this.properties.userId) {
            throw new EmployeeAlreadyLinkedError(this.properties.userId);
        }
        (this.properties as { userId?: string }).userId = userId;
        this.validate();

        this.addEvent(
            new EmployeeLinkedToUserDomainEvent({
                aggregateId: this.id,
                userId,
            }),
        );
    }

    assignPosition(positionKey: string, assignedBy: string): void {
        const existing = this.properties.positionAssignments.find((pa) => pa.positionKey === positionKey);
        if (existing) {
            throw new PositionAlreadyAssignedError(positionKey);
        }

        const assignment = new PositionAssignment({
            positionKey,
            assignedAt: new Date(),
            assignedBy,
        });

        this.properties.positionAssignments.push(assignment);
        this.validate();

        this.addEvent(
            new PositionAssignedDomainEvent({
                aggregateId: this.id,
                positionKey,
            }),
        );
    }

    unassignPosition(positionKey: string): void {
        const index = this.properties.positionAssignments.findIndex((pa) => pa.positionKey === positionKey);
        if (index === -1) {
            throw new PositionNotAssignedError(positionKey);
        }

        this.properties.positionAssignments.splice(index, 1);

        this.addEvent(
            new PositionUnassignedDomainEvent({
                aggregateId: this.id,
                positionKey,
            }),
        );
    }

    deactivate(): void {
        (this.properties as { status: EmployeeStatus }).status = EmployeeStatus.INACTIVE;

        this.addEvent(
            new EmployeeDeactivatedDomainEvent({
                aggregateId: this.id,
                userId: this.properties.userId,
            }),
        );
    }

    activate(): void {
        (this.properties as { status: EmployeeStatus }).status = EmployeeStatus.ACTIVE;
    }

    setPermissionOverride(permissionKey: string, state: PermissionOverrideState): void {
        const index = this.properties.permissionOverrides.findIndex((po) => po.permissionKey === permissionKey);
        const override = new PermissionOverride({ permissionKey, state });

        if (index !== -1) {
            this.properties.permissionOverrides[index] = override;
        } else {
            this.properties.permissionOverrides.push(override);
        }
        this.validate();
    }

    removePermissionOverride(permissionKey: string): void {
        const index = this.properties.permissionOverrides.findIndex((po) => po.permissionKey === permissionKey);
        if (index !== -1) {
            this.properties.permissionOverrides.splice(index, 1);
        }
    }

    /**
     * Computes effective permissions from position-based permissions + per-user overrides.
     * @param positionPermissions - Map of positionKey → permission keys
     */
    getEffectivePermissions(positionPermissions: ReadonlyMap<string, readonly string[]>): string[] {
        const permissions = new Set<string>();

        for (const assignment of this.properties.positionAssignments) {
            const posPerms = positionPermissions.get(assignment.positionKey);
            if (posPerms) {
                for (const perm of posPerms) {
                    permissions.add(perm);
                }
            }
        }

        for (const override of this.properties.permissionOverrides) {
            if (override.state === PermissionOverrideState.ALLOWED) {
                permissions.add(override.permissionKey);
            } else if (override.state === PermissionOverrideState.DENIED) {
                permissions.delete(override.permissionKey);
            }
        }

        return [...permissions];
    }

    hasPosition(positionKey: string): boolean {
        return this.properties.positionAssignments.some((pa) => pa.positionKey === positionKey);
    }

    get userId(): string | undefined {
        return this.properties.userId;
    }

    get firstName(): string {
        return this.properties.firstName;
    }

    get lastName(): string {
        return this.properties.lastName;
    }

    get email(): string | undefined {
        return this.properties.email;
    }

    get phone(): string | undefined {
        return this.properties.phone;
    }

    get status(): EmployeeStatus {
        return this.properties.status;
    }

    get positionAssignments(): PositionAssignment[] {
        return this.properties.positionAssignments;
    }

    get permissionOverrides(): PermissionOverride[] {
        return this.properties.permissionOverrides;
    }
}
