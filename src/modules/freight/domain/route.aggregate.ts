import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { CrewMember } from "./crew-member.value-object.js";
import { RouteSchedule } from "./route-schedule.value-object.js";
import { RouteStatus } from "./route-status.enum.js";
import { RouteStop } from "./route-stop.value-object.js";
import {
    RouteAlreadyActiveError,
    RouteAlreadyArchivedError,
    RouteAlreadyInactiveError,
    RouteArchivedCannotBeModifiedError,
} from "./route.errors.js";
import { RouteCreatedDomainEvent } from "./events/route-created.domain-event.js";
import { RouteArchivedDomainEvent } from "./events/route-archived.domain-event.js";

const routeSchema = z.object({
    name: z.string().min(1),
    status: z.enum(RouteStatus),
    vehicleIds: z.array(z.string()),
    crewMembers: z.array(z.instanceof(CrewMember)),
    stops: z.array(z.instanceof(RouteStop)),
    schedule: z.instanceof(RouteSchedule).optional(),
});

export type RouteProperties = z.infer<typeof routeSchema>;

export interface CreateRouteProps {
    name: string;
}

export class RouteAggregate extends AggregateRoot<RouteProperties> {
    static create(props: CreateRouteProps): RouteAggregate {
        const route = new RouteAggregate({
            properties: {
                name: props.name,
                status: RouteStatus.ACTIVE,
                vehicleIds: [],
                crewMembers: [],
                stops: [],
                schedule: undefined,
            },
        });

        route.validate();

        route.addEvent(
            new RouteCreatedDomainEvent({
                aggregateId: route.id,
                routeName: props.name,
            }),
        );

        return route;
    }

    static reconstitute(props: EntityProps<RouteProperties>): RouteAggregate {
        return new RouteAggregate(props);
    }

    validate(): void {
        routeSchema.parse(this.properties);
    }

    get name(): string {
        return this.properties.name;
    }

    get status(): RouteStatus {
        return this.properties.status;
    }

    get vehicleIds(): string[] {
        return this.properties.vehicleIds;
    }

    get crewMembers(): CrewMember[] {
        return this.properties.crewMembers;
    }

    get stops(): RouteStop[] {
        return this.properties.stops;
    }

    get schedule(): RouteSchedule | undefined {
        return this.properties.schedule;
    }

    private ensureNotArchived(): void {
        if (this.status === RouteStatus.ARCHIVED) {
            throw new RouteArchivedCannotBeModifiedError(this.id as string);
        }
    }

    update(props: Partial<Pick<RouteProperties, "name" | "vehicleIds" | "crewMembers" | "stops" | "schedule">>): void {
        this.ensureNotArchived();
        Object.assign(this.properties, props);
        this.validate();
    }

    activate(): void {
        this.ensureNotArchived();
        if (this.status === RouteStatus.ACTIVE) {
            throw new RouteAlreadyActiveError(this.id as string);
        }
        this.properties.status = RouteStatus.ACTIVE;
    }

    deactivate(): void {
        this.ensureNotArchived();
        if (this.status === RouteStatus.INACTIVE) {
            throw new RouteAlreadyInactiveError(this.id as string);
        }
        this.properties.status = RouteStatus.INACTIVE;
    }

    archive(): void {
        if (this.status === RouteStatus.ARCHIVED) {
            throw new RouteAlreadyArchivedError(this.id as string);
        }
        this.properties.status = RouteStatus.ARCHIVED;
        this.addEvent(
            new RouteArchivedDomainEvent({
                aggregateId: this.id,
            }),
        );
    }
}
