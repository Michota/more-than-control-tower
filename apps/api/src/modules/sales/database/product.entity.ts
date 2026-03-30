import { defineEntity, p } from "@mikro-orm/core";
import { ItemCategory } from "./item-category.entity";
import { Price } from "./price.entity";

const ProductSchema = defineEntity({
    name: "Product",
    tableName: "product", // ? there's a chance we might need to rename it to "item", as it's more "atomic". Bundles can be considered products, but items not.
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        description: p.string().nullable(),
        category: () => p.manyToOne(ItemCategory),
        vatRate: p.decimal(), // allowed: 0, 5, 8, 23
        availableFrom: p.datetime(),
        availableTo: p.datetime().nullable(), // null means its still active
        prices: () => p.oneToMany(Price).mappedBy("product").orphanRemoval(),
    },
});

class Product extends ProductSchema.class {}

ProductSchema.setClass(Product);

export { Product, ProductSchema };
