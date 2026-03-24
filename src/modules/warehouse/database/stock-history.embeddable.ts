import { defineEntity, p } from "@mikro-orm/core";

const StockHistoryEntrySchema = defineEntity({
    name: "StockHistoryEntry",
    embeddable: true,
    properties: {
        eventType: p.string(),
        quantityDelta: p.integer(),
        quantityAfter: p.integer(),
        note: p.string().nullable(),
        removalReason: p.string().nullable(),
        relatedWarehouseId: p.string().nullable(),
        occurredAt: p.datetime(),
    },
});

class StockHistoryEntry extends StockHistoryEntrySchema.class {}

StockHistoryEntrySchema.setClass(StockHistoryEntry);

export { StockHistoryEntry, StockHistoryEntrySchema };
