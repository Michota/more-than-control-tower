import { defineEntity, p } from "@mikro-orm/core";
import { Product } from "./product.entity.js";

const OrderLineSchema = defineEntity({
    name: "OrderLine",
    embeddable: true,
    properties: {
        product: () => p.manyToOne(Product),
        quantity: p.integer(),
        goodId: p.uuid().nullable(),
        stockEntryId: p.uuid().nullable(),
    },
});

class OrderLine extends OrderLineSchema.class {}

OrderLineSchema.setClass(OrderLine);

export { OrderLine, OrderLineSchema };
