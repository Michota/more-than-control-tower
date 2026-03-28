import { z } from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { WorkingHoursStatus } from "./working-hours-status.enum.js";
import { WorkingHoursEntryAlreadyLockedError, WorkingHoursEntryLockedError } from "./working-hours-entry.errors.js";
import { WorkingHoursLoggedDomainEvent } from "./events/working-hours-logged.domain-event.js";
import { WorkingHoursEditedDomainEvent } from "./events/working-hours-edited.domain-event.js";
import { WorkingHoursLockedDomainEvent } from "./events/working-hours-locked.domain-event.js";

export interface WorkingHoursEntryProperties {
    employeeId: string;
    date: string;
    hours: number;
    note?: string;
    activityId?: string;
    status: WorkingHoursStatus;
    lockedBy?: string;
}

type LogWorkingHoursProperties = Omit<WorkingHoursEntryProperties, "status" | "lockedBy">;

const workingHoursSchema = z.object({
    employeeId: z.uuid(),
    date: z.string().date(),
    hours: z.number().positive().max(24),
    note: z.string().max(1000).optional(),
    activityId: z.uuid().optional(),
    status: z.enum(["OPEN", "LOCKED"]),
    lockedBy: z.uuid().optional(),
});

export class WorkingHoursEntryAggregate extends AggregateRoot<WorkingHoursEntryProperties> {
    static log(properties: LogWorkingHoursProperties): WorkingHoursEntryAggregate {
        const entry = new WorkingHoursEntryAggregate({
            properties: {
                ...properties,
                status: WorkingHoursStatus.OPEN,
            },
        });

        entry.validate();

        entry.addEvent(
            new WorkingHoursLoggedDomainEvent({
                aggregateId: entry.id,
                employeeId: properties.employeeId,
                date: properties.date,
                hours: properties.hours,
                activityId: properties.activityId,
            }),
        );

        return entry;
    }

    static reconstitute(props: EntityProps<WorkingHoursEntryProperties>): WorkingHoursEntryAggregate {
        return new WorkingHoursEntryAggregate(props);
    }

    validate(): void {
        workingHoursSchema.parse(this.properties);
    }

    get isLocked(): boolean {
        return this.properties.status === WorkingHoursStatus.LOCKED;
    }

    edit(fields: { hours?: number; note?: string; activityId?: string }): void {
        if (this.isLocked) {
            throw new WorkingHoursEntryLockedError(this.id as string);
        }

        if (fields.hours !== undefined) {
            this.properties.hours = fields.hours;
        }
        if (fields.note !== undefined) {
            this.properties.note = fields.note;
        }
        if (fields.activityId !== undefined) {
            this.properties.activityId = fields.activityId;
        }

        this.validate();

        this.addEvent(
            new WorkingHoursEditedDomainEvent({
                aggregateId: this.id,
                employeeId: this.properties.employeeId,
                hours: this.properties.hours,
            }),
        );
    }

    ensureDeletable(): void {
        if (this.isLocked) {
            throw new WorkingHoursEntryLockedError(this.id as string);
        }
    }

    lock(lockedBy: string): void {
        if (this.isLocked) {
            throw new WorkingHoursEntryAlreadyLockedError(this.id as string);
        }

        this.properties.status = WorkingHoursStatus.LOCKED;
        this.properties.lockedBy = lockedBy;

        this.addEvent(
            new WorkingHoursLockedDomainEvent({
                aggregateId: this.id,
                employeeId: this.properties.employeeId,
                lockedBy,
            }),
        );
    }
}
