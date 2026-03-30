import { z } from "zod";
import { Entity, type CreateEntityProps } from "../../../libs/ddd/entities/entity.abstract.js";

export interface ActivityLogEntryProperties {
    employeeId: string;
    action: string;
    details?: string;
    occurredAt: Date;
}

const activityLogEntrySchema = z.object({
    employeeId: z.uuid(),
    action: z.string().min(1).max(255),
    details: z.string().max(2000).optional(),
    occurredAt: z.date(),
});

export class ActivityLogEntryEntity extends Entity<ActivityLogEntryProperties> {
    static create(properties: ActivityLogEntryProperties): ActivityLogEntryEntity {
        const entry = new ActivityLogEntryEntity({ properties });
        entry.validate();
        return entry;
    }

    static reconstitute(props: CreateEntityProps<ActivityLogEntryProperties>): ActivityLogEntryEntity {
        return new ActivityLogEntryEntity(props);
    }

    validate(): void {
        activityLogEntrySchema.parse(this.properties);
    }
}
