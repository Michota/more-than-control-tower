import { defineEntity, p } from "@mikro-orm/core";

const JourneyStopSchema = defineEntity({
    name: "JourneyStopRecord",
    embeddable: true,
    properties: {
        customerId: p.string(),
        customerName: p.string(),
        addressCountry: p.string(),
        addressPostalCode: p.string(),
        addressState: p.string(),
        addressCity: p.string(),
        addressStreet: p.string(),
        orderIds: p.array().default([]),
        sequence: p.integer(),
    },
});

class JourneyStopRecord extends JourneyStopSchema.class {}

JourneyStopSchema.setClass(JourneyStopRecord);

export { JourneyStopRecord, JourneyStopSchema };
