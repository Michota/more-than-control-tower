import { defineEntity, p } from "@mikro-orm/core";

const GoodSchema = defineEntity({
    name: "Good",
    tableName: "good",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        description: p.string().nullable(),
        weightValue: p.decimal(),
        weightUnit: p.string(),
        dimensionLength: p.decimal(),
        dimensionWidth: p.decimal(),
        dimensionHeight: p.decimal(),
        dimensionUnit: p.string(),
        parentId: p.uuid().nullable(),
    },
});

class Good extends GoodSchema.class {}

GoodSchema.setClass(Good);

export { Good, GoodSchema };
