import { defineEntity, p } from "@mikro-orm/core";
import { WorkingHoursStatus } from "../domain/working-hours-status.enum.js";

const WorkingHoursEntrySchema = defineEntity({
    name: "WorkingHoursEntry",
    tableName: "working_hours_entry",
    properties: {
        id: p.uuid().primary(),
        employeeId: p.uuid(),
        date: p.type("date"),
        hours: p.decimal(),
        note: p.string().nullable(),
        activityId: p.uuid().nullable(),
        status: p.enum(() => WorkingHoursStatus),
        lockedBy: p.uuid().nullable(),
    },
});

class WorkingHoursEntry extends WorkingHoursEntrySchema.class {}

WorkingHoursEntrySchema.setClass(WorkingHoursEntry);

export { WorkingHoursEntry, WorkingHoursEntrySchema };
