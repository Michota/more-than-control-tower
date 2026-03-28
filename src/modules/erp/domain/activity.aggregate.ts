import { z } from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { ActivityCreatedDomainEvent } from "./events/activity-created.domain-event.js";

export interface ActivityProperties {
    name: string;
    description?: string;
}

const activitySchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
});

export class ActivityAggregate extends AggregateRoot<ActivityProperties> {
    static create(properties: ActivityProperties): ActivityAggregate {
        const activity = new ActivityAggregate({ properties });

        activity.validate();

        activity.addEvent(
            new ActivityCreatedDomainEvent({
                aggregateId: activity.id,
                name: properties.name,
            }),
        );

        return activity;
    }

    static reconstitute(props: EntityProps<ActivityProperties>): ActivityAggregate {
        return new ActivityAggregate(props);
    }

    validate(): void {
        activitySchema.parse(this.properties);
    }
}
