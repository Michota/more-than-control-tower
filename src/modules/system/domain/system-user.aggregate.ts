import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import z from "zod";
import { SystemUserRole } from "./system-user-role.enum.js";
import { SystemUserStatus } from "./system-user-status.enum.js";
import { SystemUserCreatedDomainEvent } from "./events/system-user-created.domain-event.js";
import { SystemUserSuspendedDomainEvent } from "./events/system-user-suspended.domain-event.js";
import { CannotRemoveOwnAdminRoleError } from "./system-user.errors.js";

const systemUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    roles: z.array(z.enum(SystemUserRole)).min(1, "User must have at least one role"),
    status: z.enum(SystemUserStatus),
});

export type SystemUserProperties = z.infer<typeof systemUserSchema>;

export class SystemUserAggregate extends AggregateRoot<SystemUserProperties> {
    static create(properties: Omit<SystemUserProperties, "status">): SystemUserAggregate {
        const user = new SystemUserAggregate({
            properties: { ...properties, status: SystemUserStatus.UNACTIVATED },
        });

        user.validate();

        user.addEvent(
            new SystemUserCreatedDomainEvent({
                aggregateId: user.id,
                email: properties.email,
            }),
        );

        return user;
    }

    static reconstitute(props: EntityProps<SystemUserProperties>): SystemUserAggregate {
        return new SystemUserAggregate(props);
    }

    validate(): void {
        systemUserSchema.parse(this.properties);
    }

    update(props: Partial<Pick<SystemUserProperties, "email" | "name">>): void {
        const defined = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined));
        Object.assign(this.properties, defined);
        this.validate();
    }

    assignRoles(roles: SystemUserRole[], actorId: string): void {
        const isRemovingOwnAdmin =
            actorId === this.id &&
            this.roles.includes(SystemUserRole.ADMINISTRATOR) &&
            !roles.includes(SystemUserRole.ADMINISTRATOR);

        if (isRemovingOwnAdmin) {
            throw new CannotRemoveOwnAdminRoleError();
        }

        Object.assign(this.properties, { roles });
        this.validate();
    }

    suspend(): void {
        Object.assign(this.properties, { status: SystemUserStatus.SUSPENDED });

        this.addEvent(
            new SystemUserSuspendedDomainEvent({
                aggregateId: this.id,
                email: this.email,
            }),
        );
    }

    activate(): void {
        Object.assign(this.properties, { status: SystemUserStatus.ACTIVATED });
    }

    get email(): string {
        return this.properties.email;
    }

    get name(): string {
        return this.properties.name;
    }

    get roles(): SystemUserRole[] {
        return this.properties.roles;
    }

    get status(): SystemUserStatus {
        return this.properties.status;
    }
}
