import { defineEntity, p } from "@mikro-orm/core";
import { StockHistoryEntry } from "./stock-history.embeddable.js";

const StockEntrySchema = defineEntity({
    name: "StockEntry",
    tableName: "stock_entry",
    properties: {
        id: p.uuid().primary(),
        goodId: p.uuid(),
        warehouseId: p.uuid(),
        sectorId: p.uuid().nullable(),
        locationInWarehouse: p.string().nullable(),
        quantity: p.integer(),
        history: p.embedded(StockHistoryEntry).array().default([]),
    },
});

class StockEntry extends StockEntrySchema.class {}

StockEntrySchema.setClass(StockEntry);

export { StockEntry, StockEntrySchema };
