import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import z from "zod";
import { AvailabilityEntryStatus } from "./availability-entry-status.enum.js";
import {
    AvailabilityAlreadyConfirmedError,
    AvailabilityAlreadyLockedError,
    NoPendingAvailabilityError,
} from "./availability-entry.errors.js";
import { AvailabilitySetDomainEvent } from "./events/availability-set.domain-event.js";
import { AvailabilityConfirmedDomainEvent } from "./events/availability-confirmed.domain-event.js";

const TIME_REGEX = /^\d{2}:\d{2}$/;

const availabilityEntrySchema = z
    .object({
        employeeId: z.string().min(1),
        date: z.string().date(),
        startTime: z.string().regex(TIME_REGEX, "Must be HH:mm format"),
        endTime: z.string().regex(TIME_REGEX, "Must be HH:mm format"),
        status: z.enum(AvailabilityEntryStatus),
        locked: z.boolean(),
    })
    .refine((data) => data.startTime < data.endTime, {
        message: "startTime must be before endTime",
    });

export type AvailabilityEntryProperties = z.infer<typeof availabilityEntrySchema>;

export class AvailabilityEntryAggregate extends AggregateRoot<AvailabilityEntryProperties> {
    static create(
        properties: Omit<AvailabilityEntryProperties, "status" | "locked"> & { setByManager: boolean },
    ): AvailabilityEntryAggregate {
        const { setByManager, ...rest } = properties;
        const entry = new AvailabilityEntryAggregate({
            properties: {
                ...rest,
                status: setByManager ? AvailabilityEntryStatus.CONFIRMED : AvailabilityEntryStatus.PENDING_APPROVAL,
                locked: false,
            },
        });

        entry.validate();

        entry.addEvent(
            new AvailabilitySetDomainEvent({
                aggregateId: entry.id,
                employeeId: rest.employeeId,
                date: rest.date,
                status: entry.properties.status,
            }),
        );

        return entry;
    }

    static reconstitute(props: EntityProps<AvailabilityEntryProperties>): AvailabilityEntryAggregate {
        return new AvailabilityEntryAggregate(props);
    }

    validate(): void {
        availabilityEntrySchema.parse(this.properties);
    }

    confirm(): void {
        if (this.properties.status === AvailabilityEntryStatus.CONFIRMED) {
            throw new AvailabilityAlreadyConfirmedError(this.id);
        }
        (this.properties as { status: AvailabilityEntryStatus }).status = AvailabilityEntryStatus.CONFIRMED;

        this.addEvent(
            new AvailabilityConfirmedDomainEvent({
                aggregateId: this.id,
                employeeId: this.properties.employeeId,
                date: this.properties.date,
            }),
        );
    }

    lock(): void {
        if (this.properties.locked) {
            throw new AvailabilityAlreadyLockedError(this.id);
        }
        (this.properties as { locked: boolean }).locked = true;
    }

    requirePendingApproval(): void {
        if (this.properties.status !== AvailabilityEntryStatus.PENDING_APPROVAL) {
            throw new NoPendingAvailabilityError(this.id);
        }
    }

    get employeeId(): string {
        return this.properties.employeeId;
    }

    get date(): string {
        return this.properties.date;
    }

    get startTime(): string {
        return this.properties.startTime;
    }

    get endTime(): string {
        return this.properties.endTime;
    }

    get status(): AvailabilityEntryStatus {
        return this.properties.status;
    }

    get locked(): boolean {
        return this.properties.locked;
    }

    isLocked(now: Date): boolean {
        if (this.properties.locked) {
            return true;
        }
        const entryStart = new Date(`${this.properties.date}T${this.properties.startTime}:00`);
        return now >= entryStart;
    }
}
