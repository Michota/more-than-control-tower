import { defineEntity, p } from "@mikro-orm/core";
import { currency } from "../../../shared/persistence/currency.property.js";
import { PriceType } from "./price-type.entity.js";
import { Product } from "./product.entity.js";

const PriceSchema = defineEntity({
    name: "Price",
    tableName: "price",
    properties: {
        id: p.uuid().primary(),
        amount: p.decimal(),
        currency,
        validFrom: p.datetime(),
        validTo: p.datetime().nullable(), // null means its still active
        product: () => p.manyToOne(Product).inversedBy("prices"),
        priceType: () => p.manyToOne(PriceType).nullable(),

        // ? vatRate
    },
});

class Price extends PriceSchema.class {}

PriceSchema.setClass(Price);

export { Price, PriceSchema };
