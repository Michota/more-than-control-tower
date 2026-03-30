import { defineEntity, p } from "@mikro-orm/core";

const ActivityLogEntrySchema = defineEntity({
    name: "ActivityLogEntry",
    tableName: "activity_log_entry",
    properties: {
        id: p.uuid().primary(),
        employeeId: p.uuid(),
        action: p.string(),
        details: p.string().nullable(),
        occurredAt: p.type("timestamptz"),
    },
});

class ActivityLogEntry extends ActivityLogEntrySchema.class {}

ActivityLogEntrySchema.setClass(ActivityLogEntry);

export { ActivityLogEntry, ActivityLogEntrySchema };
