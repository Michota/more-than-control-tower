import { defineEntity, p } from "@mikro-orm/core";

const StockEntryAttributeSchema = defineEntity({
    name: "StockEntryAttribute",
    embeddable: true,
    properties: {
        name: p.string(),
        type: p.string(),
        value: p.string(),
    },
});

class StockEntryAttribute extends StockEntryAttributeSchema.class {}

StockEntryAttributeSchema.setClass(StockEntryAttribute);

export { StockEntryAttribute, StockEntryAttributeSchema };
