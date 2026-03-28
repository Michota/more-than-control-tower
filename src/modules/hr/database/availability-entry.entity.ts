import { defineEntity, p } from "@mikro-orm/core";
import { AvailabilityEntryStatus } from "../domain/availability-entry-status.enum.js";

const AvailabilityEntrySchema = defineEntity({
    name: "AvailabilityEntry",
    tableName: "employee_availability_entry",
    properties: {
        id: p.uuid().primary(),
        employeeId: p.uuid(),
        date: p.string(),
        startTime: p.string(),
        endTime: p.string(),
        status: p.enum(() => AvailabilityEntryStatus),
    },
});

class AvailabilityEntry extends AvailabilityEntrySchema.class {}

AvailabilityEntrySchema.setClass(AvailabilityEntry);

export { AvailabilityEntry, AvailabilityEntrySchema };
