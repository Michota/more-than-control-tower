import { RequiredEntityData } from "@mikro-orm/core";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { ActivityLogEntryEntity } from "../domain/activity-log-entry.entity.js";
import { ActivityLogEntry } from "./activity-log-entry.entity.js";

export class ActivityLogEntryMapper implements Mapper<ActivityLogEntryEntity, RequiredEntityData<ActivityLogEntry>> {
    toDomain(record: ActivityLogEntry): ActivityLogEntryEntity {
        return ActivityLogEntryEntity.reconstitute({
            id: record.id as EntityId,
            properties: {
                employeeId: record.employeeId,
                action: record.action,
                details: record.details ?? undefined,
                occurredAt: record.occurredAt,
            },
        });
    }

    toPersistence(domain: ActivityLogEntryEntity): RequiredEntityData<ActivityLogEntry> {
        const props = domain.properties;
        return {
            id: domain.id as string,
            employeeId: props.employeeId,
            action: props.action,
            details: props.details ?? null,
            occurredAt: props.occurredAt,
        };
    }

    toResponse(entity: ActivityLogEntryEntity) {
        return entity.toJSON();
    }
}
