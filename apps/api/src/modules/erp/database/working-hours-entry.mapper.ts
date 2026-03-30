import { RequiredEntityData } from "@mikro-orm/core";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { WorkingHoursEntryAggregate } from "../domain/working-hours-entry.aggregate.js";
import { WorkingHoursStatus } from "../domain/working-hours-status.enum.js";
import { WorkingHoursEntry } from "./working-hours-entry.entity.js";

export class WorkingHoursEntryMapper implements Mapper<
    WorkingHoursEntryAggregate,
    RequiredEntityData<WorkingHoursEntry>
> {
    toDomain(record: WorkingHoursEntry): WorkingHoursEntryAggregate {
        return WorkingHoursEntryAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                employeeId: record.employeeId,
                date: String(record.date),
                hours: Number(record.hours),
                note: record.note ?? undefined,
                activityId: record.activityId ?? undefined,
                status: record.status as unknown as WorkingHoursStatus,
                lockedBy: record.lockedBy ?? undefined,
            },
        });
    }

    toPersistence(domain: WorkingHoursEntryAggregate): RequiredEntityData<WorkingHoursEntry> {
        const props = domain.properties;
        return {
            id: domain.id as string,
            employeeId: props.employeeId,
            date: props.date,
            hours: String(props.hours),
            note: props.note ?? null,
            activityId: props.activityId ?? null,
            status: props.status,
            lockedBy: props.lockedBy ?? null,
        };
    }

    toResponse(entity: WorkingHoursEntryAggregate) {
        return entity.toJSON();
    }
}
