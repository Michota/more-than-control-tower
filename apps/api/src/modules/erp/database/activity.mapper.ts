import { RequiredEntityData } from "@mikro-orm/core";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { ActivityAggregate } from "../domain/activity.aggregate.js";
import { Activity } from "./activity.entity.js";

export class ActivityMapper implements Mapper<ActivityAggregate, RequiredEntityData<Activity>> {
    toDomain(record: Activity): ActivityAggregate {
        return ActivityAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                description: record.description ?? undefined,
            },
        });
    }

    toPersistence(domain: ActivityAggregate): RequiredEntityData<Activity> {
        const props = domain.properties;
        return {
            id: domain.id as string,
            name: props.name,
            description: props.description ?? null,
        };
    }

    toResponse(entity: ActivityAggregate) {
        return entity.toJSON();
    }
}
