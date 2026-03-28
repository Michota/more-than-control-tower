import { defineEntity, p } from "@mikro-orm/core";
import { JourneyStatus } from "../domain/journey-status.enum.js";

const JourneySchema = defineEntity({
    name: "Journey",
    tableName: "journey",
    properties: {
        id: p.uuid().primary(),
        routeId: p.uuid(),
        routeName: p.string(),
        status: p.enum(() => JourneyStatus),
        scheduledDate: p.string(),
        vehicleIds: p.array().default([]),
        representativeIds: p.array().default([]),
        visitPointIds: p.array().default([]),
    },
});

class Journey extends JourneySchema.class {}

JourneySchema.setClass(Journey);

export { Journey, JourneySchema };
