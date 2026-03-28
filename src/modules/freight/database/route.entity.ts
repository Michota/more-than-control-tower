import { defineEntity, p } from "@mikro-orm/core";
import { RouteStatus } from "../domain/route-status.enum.js";
import { ScheduleType } from "../domain/route-schedule.value-object.js";
import { RouteStopRecord } from "./route-stop.embeddable.js";

const RouteSchema = defineEntity({
    name: "Route",
    tableName: "route",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        status: p.enum(() => RouteStatus),
        vehicleIds: p.array().default([]),
        representativeIds: p.array().default([]),
        stops: p.embedded(RouteStopRecord).array().default([]),
        scheduleType: p.enum(() => ScheduleType).nullable(),
        scheduleDaysOfWeek: p.array().nullable(),
        scheduleDaysOfMonth: p.array().nullable(),
        scheduleSpecificDates: p.array().nullable(),
    },
});

class Route extends RouteSchema.class {}

RouteSchema.setClass(Route);

export { Route, RouteSchema };
