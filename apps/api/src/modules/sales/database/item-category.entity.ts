import { defineEntity, p } from "@mikro-orm/core";

const ItemCategorySchema = defineEntity({
    name: "ItemCategory",
    tableName: "items_category",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        description: p.string().nullable(),
    },
});

class ItemCategory extends ItemCategorySchema.class {}

ItemCategorySchema.setClass(ItemCategory);

export { ItemCategory, ItemCategorySchema };
