import { defineEntity, p } from "@mikro-orm/core";
import { GoodHistoryEntry } from "./good-history.embeddable.js";

const GoodSchema = defineEntity({
    name: "Good",
    tableName: "good",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        description: p.string().nullable(),
        weightValue: p.decimal(),
        weightUnit: p.string(),
        dimensionLength: p.decimal(),
        dimensionWidth: p.decimal(),
        dimensionHeight: p.decimal(),
        dimensionUnit: p.string(),
        warehouseId: p.uuid().nullable(),
        locationInWarehouse: p.string().nullable(),
        parentId: p.uuid().nullable(),
        history: p.embedded(GoodHistoryEntry).array().default([]),
    },
});

class Good extends GoodSchema.class {}

GoodSchema.setClass(Good);

export { Good, GoodSchema };
