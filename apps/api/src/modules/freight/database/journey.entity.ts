import { defineEntity, p } from "@mikro-orm/core";
import { JourneyStatus } from "../domain/journey-status.enum.js";
import { CrewMemberRecord } from "./crew-member.embeddable.js";
import { JourneyStopRecord } from "./journey-stop.embeddable.js";

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
        crewMembers: p.embedded(CrewMemberRecord).array().default([]),
        stops: p.embedded(JourneyStopRecord).array().default([]),
        loadingDeadline: p.string().nullable(),
    },
});

class Journey extends JourneySchema.class {}

JourneySchema.setClass(Journey);

export { Journey, JourneySchema };
