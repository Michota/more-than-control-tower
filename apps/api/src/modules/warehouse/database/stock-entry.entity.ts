import { defineEntity, p } from "@mikro-orm/core";
import { StockEntryAttribute } from "./stock-entry-attribute.embeddable.js";
import { StockHistoryEntry } from "./stock-history.embeddable.js";

const StockEntrySchema = defineEntity({
    name: "StockEntry",
    tableName: "stock_entry",
    properties: {
        id: p.uuid().primary(),
        goodId: p.uuid(),
        warehouseId: p.uuid(),
        sectorId: p.uuid().nullable(),
        quantity: p.integer(),
        attributes: p.embedded(StockEntryAttribute).array().default([]),
        history: p.embedded(StockHistoryEntry).array().default([]),
    },
});

class StockEntry extends StockEntrySchema.class {}

StockEntrySchema.setClass(StockEntry);

export { StockEntry, StockEntrySchema };
