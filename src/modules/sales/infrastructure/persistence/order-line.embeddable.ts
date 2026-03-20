import { defineEntity, p } from "@mikro-orm/core";
import { Product } from "./product.entity";

const OrderLineSchema = defineEntity({
    name: "OrderLine",
    embeddable: true,
    properties: {
        product: () => p.manyToOne(Product),
        quantity: p.integer(),
        // Disabled. Remove or re-enable, base on experience.
        // vatRate: p.decimal(),
        // currency,
    },
});

class OrderLine extends OrderLineSchema.class {}

OrderLineSchema.setClass(OrderLine);

export { OrderLine, OrderLineSchema };
