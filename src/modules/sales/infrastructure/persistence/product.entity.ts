import { defineEntity, p } from "@mikro-orm/core";
import { currency } from "@src/shared/persistence/currency.property";

const Product = defineEntity({
    name: "Product",
    embeddable: true,
    properties: {
        id: p.uuid(),
        productName: p.string(),
        unitPrice: p.decimal(),
        currency: currency,
    },
});

export { Product };
