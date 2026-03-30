import { defineEntity, p } from "@mikro-orm/core";

const PositionSchema = defineEntity({
    name: "Position",
    tableName: "position",
    properties: {
        id: p.uuid().primary(),
        key: p.string().unique(),
        displayName: p.string(),
        permissionKeys: p.type("jsonb").default([]),
    },
});

class Position extends PositionSchema.class {}

PositionSchema.setClass(Position);

export { Position, PositionSchema };
