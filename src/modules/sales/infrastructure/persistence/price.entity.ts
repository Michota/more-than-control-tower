import { defineEntity, p } from "@mikro-orm/core";
import { currency } from "@src/shared/persistence/currency.property";
import { Product } from "./product.entity";

// TODO: in the future this might be useful, as we plan to add types of prices

export const PriceSchema = defineEntity({
    name: "Price",
    tableName: "prices",
    properties: {
        id: p.uuid().primary(),
        amount: p.decimal(),
        currency,
        validFrom: p.datetime(),
        validTo: p.datetime().nullable(), // null means its still active
        product: () => p.manyToOne(Product),
    },
});
