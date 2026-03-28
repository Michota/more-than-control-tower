import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { JourneyStatus } from "./journey-status.enum.js";
import { JourneyStop } from "./journey-stop.value-object.js";
import { RouteStop } from "./route-stop.value-object.js";
import {
    JourneyAlreadyCancelledError,
    JourneyAlreadyCompletedError,
    JourneyCannotStartError,
    JourneyNotInProgressError,
    JourneyNotPlannedError,
    JourneyStopAlreadyExistsError,
    JourneyStopNotFoundError,
    OrderAlreadyAssignedToStopError,
    OrderNotAssignedToStopError,
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
    stops: z.array(z.instanceof(JourneyStop)),
});

export type JourneyProperties = z.infer<typeof journeySchema>;

export interface CreateJourneyFromRouteProps {
    routeId: string;
    routeName: string;
    scheduledDate: string;
    vehicleIds: string[];
    representativeIds: string[];
    stops: RouteStop[];
}

export class JourneyAggregate extends AggregateRoot<JourneyProperties> {
    static createFromRoute(props: CreateJourneyFromRouteProps): JourneyAggregate {
        const journeyStops = props.stops.map(
            (s) =>
                new JourneyStop({
                    customerId: s.customerId,
                    customerName: s.customerName,
                    address: s.address,
                    orderIds: [],
                    sequence: s.sequence,
                }),
        );

        const journey = new JourneyAggregate({
            properties: {
                routeId: props.routeId,
                routeName: props.routeName,
                status: JourneyStatus.PLANNED,
                scheduledDate: props.scheduledDate,
                vehicleIds: props.vehicleIds,
                representativeIds: props.representativeIds,
                stops: journeyStops,
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

    get stops(): JourneyStop[] {
        return this.properties.stops;
    }

    // ─── Guards ─────────────────────────────────────────────

    private ensureNotTerminal(): void {
        if (this.status === JourneyStatus.COMPLETED) {
            throw new JourneyAlreadyCompletedError(this.id as string);
        }
        if (this.status === JourneyStatus.CANCELLED) {
            throw new JourneyAlreadyCancelledError(this.id as string);
        }
    }

    private ensurePlanned(): void {
        if (this.status !== JourneyStatus.PLANNED) {
            throw new JourneyNotPlannedError(this.id as string);
        }
    }

    private findStopIndex(customerId: string): number {
        return this.stops.findIndex((s) => s.customerId === customerId);
    }

    // ─── Lifecycle ──────────────────────────────────────────

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

    // ─── Stop management (PLANNED only) ─────────────────────

    addStop(stop: JourneyStop): void {
        this.ensurePlanned();
        const existing = this.findStopIndex(stop.customerId);
        if (existing !== -1) {
            throw new JourneyStopAlreadyExistsError(this.id as string, stop.customerId);
        }
        this.properties.stops.push(stop);
        this.validate();
    }

    removeStop(customerId: string): void {
        this.ensurePlanned();
        const idx = this.findStopIndex(customerId);
        if (idx === -1) {
            throw new JourneyStopNotFoundError(this.id as string, customerId);
        }
        this.properties.stops.splice(idx, 1);
    }

    assignOrderToStop(customerId: string, orderId: string): void {
        this.ensurePlanned();
        const idx = this.findStopIndex(customerId);
        if (idx === -1) {
            throw new JourneyStopNotFoundError(this.id as string, customerId);
        }
        const stop = this.stops[idx];
        if (stop.orderIds.includes(orderId)) {
            throw new OrderAlreadyAssignedToStopError(orderId, customerId);
        }
        this.properties.stops[idx] = stop.withOrders([...stop.orderIds, orderId]);
    }

    unassignOrderFromStop(customerId: string, orderId: string): void {
        this.ensurePlanned();
        const idx = this.findStopIndex(customerId);
        if (idx === -1) {
            throw new JourneyStopNotFoundError(this.id as string, customerId);
        }
        const stop = this.stops[idx];
        if (!stop.orderIds.includes(orderId)) {
            throw new OrderNotAssignedToStopError(orderId, customerId);
        }
        this.properties.stops[idx] = stop.withOrders(stop.orderIds.filter((id) => id !== orderId));
    }

    reorderStops(stopSequences: { customerId: string; sequence: number }[]): void {
        this.ensurePlanned();
        for (const { customerId, sequence } of stopSequences) {
            const idx = this.findStopIndex(customerId);
            if (idx === -1) {
                throw new JourneyStopNotFoundError(this.id as string, customerId);
            }
            this.properties.stops[idx] = this.stops[idx].withSequence(sequence);
        }
        this.validate();
    }
}
