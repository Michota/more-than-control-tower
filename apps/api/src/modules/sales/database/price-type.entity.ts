import { defineEntity, p } from "@mikro-orm/core";

const PriceTypeSchema = defineEntity({
    name: "PriceType",
    tableName: "price_type",
    properties: {
        id: p.uuid().primary(),
        name: p.string().unique(),
    },
});

class PriceType extends PriceTypeSchema.class {}

PriceTypeSchema.setClass(PriceType);

export { PriceType, PriceTypeSchema };
