import { defineEntity, p } from "@mikro-orm/core";

const VehicleAttributeSchema = defineEntity({
    name: "VehicleAttribute",
    embeddable: true,
    properties: {
        name: p.string(),
        value: p.string(),
    },
});

class VehicleAttributeRecord extends VehicleAttributeSchema.class {}

VehicleAttributeSchema.setClass(VehicleAttributeRecord);

export { VehicleAttributeRecord, VehicleAttributeSchema };
