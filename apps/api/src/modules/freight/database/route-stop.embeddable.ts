import { defineEntity, p } from "@mikro-orm/core";

const RouteStopSchema = defineEntity({
    name: "RouteStopRecord",
    embeddable: true,
    properties: {
        customerId: p.string(),
        customerName: p.string(),
        addressCountry: p.string(),
        addressPostalCode: p.string(),
        addressState: p.string(),
        addressCity: p.string(),
        addressStreet: p.string(),
        sequence: p.integer(),
    },
});

class RouteStopRecord extends RouteStopSchema.class {}

RouteStopSchema.setClass(RouteStopRecord);

export { RouteStopRecord, RouteStopSchema };
