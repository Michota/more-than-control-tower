import { defineEntity, p } from "@mikro-orm/core";
import { Product } from "./product.entity";

const OrderLineSchema = defineEntity({
    name: "OrderLine",
    embeddable: true,
    properties: {
        product: () => p.manyToOne(Product),
        quantity: p.integer(),
        stockEntryId: p.uuid().nullable(),
    },
});

class OrderLine extends OrderLineSchema.class {}

OrderLineSchema.setClass(OrderLine);

export { OrderLine, OrderLineSchema };
