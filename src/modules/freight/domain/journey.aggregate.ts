import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { JourneyStatus } from "./journey-status.enum.js";
import {
    JourneyAlreadyCancelledError,
    JourneyAlreadyCompletedError,
    JourneyCannotStartError,
    JourneyNotInProgressError,
} from "./journey.errors.js";
import { JourneyCreatedDomainEvent } from "./events/journey-created.domain-event.js";
import { JourneyStartedDomainEvent } from "./events/journey-started.domain-event.js";
import { JourneyCompletedDomainEvent } from "./events/journey-completed.domain-event.js";

const journeySchema = z.object({
    routeId: z.string().min(1),
    routeName: z.string().min(1),
    status: z.enum(JourneyStatus),
    scheduledDate: z.string().date(),
    vehicleIds: z.array(z.string()),
    representativeIds: z.array(z.string()),
    visitPointIds: z.array(z.string()),
});

export type JourneyProperties = z.infer<typeof journeySchema>;

export interface CreateJourneyFromRouteProps {
    routeId: string;
    routeName: string;
    scheduledDate: string;
    vehicleIds: string[];
    representativeIds: string[];
    visitPointIds: string[];
}

export class JourneyAggregate extends AggregateRoot<JourneyProperties> {
    static createFromRoute(props: CreateJourneyFromRouteProps): JourneyAggregate {
        const journey = new JourneyAggregate({
            properties: {
                routeId: props.routeId,
                routeName: props.routeName,
                status: JourneyStatus.PLANNED,
                scheduledDate: props.scheduledDate,
                vehicleIds: props.vehicleIds,
                representativeIds: props.representativeIds,
                visitPointIds: props.visitPointIds,
            },
        });

        journey.validate();

        journey.addEvent(
            new JourneyCreatedDomainEvent({
                aggregateId: journey.id,
                routeId: props.routeId,
                scheduledDate: props.scheduledDate,
            }),
        );

        return journey;
    }

    static reconstitute(props: EntityProps<JourneyProperties>): JourneyAggregate {
        return new JourneyAggregate(props);
    }

    validate(): void {
        journeySchema.parse(this.properties);
    }

    get routeId(): string {
        return this.properties.routeId;
    }

    get routeName(): string {
        return this.properties.routeName;
    }

    get status(): JourneyStatus {
        return this.properties.status;
    }

    get scheduledDate(): string {
        return this.properties.scheduledDate;
    }

    get vehicleIds(): string[] {
        return this.properties.vehicleIds;
    }

    get representativeIds(): string[] {
        return this.properties.representativeIds;
    }

    get visitPointIds(): string[] {
        return this.properties.visitPointIds;
    }

    private ensureNotTerminal(): void {
        if (this.status === JourneyStatus.COMPLETED) {
            throw new JourneyAlreadyCompletedError(this.id as string);
        }
        if (this.status === JourneyStatus.CANCELLED) {
            throw new JourneyAlreadyCancelledError(this.id as string);
        }
    }

    start(): void {
        this.ensureNotTerminal();
        if (this.status !== JourneyStatus.PLANNED) {
            throw new JourneyCannotStartError(this.id as string);
        }
        this.properties.status = JourneyStatus.IN_PROGRESS;
        this.addEvent(
            new JourneyStartedDomainEvent({
                aggregateId: this.id,
            }),
        );
    }

    complete(): void {
        this.ensureNotTerminal();
        if (this.status !== JourneyStatus.IN_PROGRESS) {
            throw new JourneyNotInProgressError(this.id as string);
        }
        this.properties.status = JourneyStatus.COMPLETED;
        this.addEvent(
            new JourneyCompletedDomainEvent({
                aggregateId: this.id,
            }),
        );
    }

    cancel(): void {
        this.ensureNotTerminal();
        this.properties.status = JourneyStatus.CANCELLED;
    }
}
