import { defineEntity, p } from "@mikro-orm/core";
import { GoodsReceiptStatus } from "../domain/goods-receipt-status.enum.js";
import { GoodsReceiptLine } from "./goods-receipt-line.embeddable.js";

const GoodsReceiptSchema = defineEntity({
    name: "GoodsReceipt",
    tableName: "goods_receipt",
    properties: {
        id: p.uuid().primary(),
        targetWarehouseId: p.uuid(),
        note: p.string().nullable(),
        status: p.enum(() => GoodsReceiptStatus),
        lines: p.embedded(GoodsReceiptLine).array().default([]),
    },
});

class GoodsReceipt extends GoodsReceiptSchema.class {}

GoodsReceiptSchema.setClass(GoodsReceipt);

export { GoodsReceipt, GoodsReceiptSchema };
