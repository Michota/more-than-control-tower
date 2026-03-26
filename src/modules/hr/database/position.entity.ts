import { defineEntity, p } from "@mikro-orm/core";

const PositionSchema = defineEntity({
    name: "Position",
    tableName: "position",
    properties: {
        id: p.uuid().primary(),
        key: p.string().unique(),
        displayName: p.string(),
        qualificationSchema: p.type("jsonb").default([]),
        permissionKeys: p.type("jsonb").default([]),
    },
});

class Position extends PositionSchema.class {}

PositionSchema.setClass(Position);

export { Position, PositionSchema };
