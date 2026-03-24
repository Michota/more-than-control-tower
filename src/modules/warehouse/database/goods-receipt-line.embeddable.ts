import { defineEntity, p } from "@mikro-orm/core";

const GoodsReceiptLineSchema = defineEntity({
    name: "GoodsReceiptLine",
    embeddable: true,
    properties: {
        goodId: p.uuid(),
        quantity: p.integer(),
        locationDescription: p.string().nullable(),
        note: p.string().nullable(),
    },
});

class GoodsReceiptLine extends GoodsReceiptLineSchema.class {}

GoodsReceiptLineSchema.setClass(GoodsReceiptLine);

export { GoodsReceiptLine, GoodsReceiptLineSchema };
