import { defineEntity, p } from "@mikro-orm/core";
import { currency } from "@src/shared/persistence/currency.property";

const OrderLine = defineEntity({
    name: "OrderLine",
    embeddable: true,
    properties: {
        productId: p.uuid(),
        productName: p.string(),
        quantity: p.integer(),
        unitPrice: p.decimal(),
        currency,
    },
});

export { OrderLine };
