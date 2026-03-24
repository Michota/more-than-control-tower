import { defineEntity, p } from "@mikro-orm/core";

const GoodsReceiptLineSchema = defineEntity({
    name: "GoodsReceiptLine",
    embeddable: true,
    properties: {
        goodId: p.uuid(),
        quantity: p.integer(),
        sectorId: p.uuid().nullable(),
        attributes: p.json<{ name: string; type: string; value: string }[]>().default([]),
        note: p.string().nullable(),
    },
});

class GoodsReceiptLine extends GoodsReceiptLineSchema.class {}

GoodsReceiptLineSchema.setClass(GoodsReceiptLine);

export { GoodsReceiptLine, GoodsReceiptLineSchema };
