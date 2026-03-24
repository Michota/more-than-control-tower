import { defineEntity, p } from "@mikro-orm/core";

const GoodHistoryEntrySchema = defineEntity({
    name: "GoodHistoryEntry",
    embeddable: true,
    properties: {
        eventType: p.string(),
        note: p.string().nullable(),
        removalReason: p.string().nullable(),
        fromWarehouseId: p.string().nullable(),
        toWarehouseId: p.string().nullable(),
        occurredAt: p.datetime(),
    },
});

class GoodHistoryEntry extends GoodHistoryEntrySchema.class {}

GoodHistoryEntrySchema.setClass(GoodHistoryEntry);

export { GoodHistoryEntry, GoodHistoryEntrySchema };
