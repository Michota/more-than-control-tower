import { defineEntity, p } from "@mikro-orm/core";
import { SectorStatus } from "../domain/sector-status.enum.js";

const SectorSchema = defineEntity({
    name: "Sector",
    tableName: "sector",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        description: p.string().nullable(),
        warehouseId: p.uuid(),
        dimensionLength: p.decimal(),
        dimensionWidth: p.decimal(),
        dimensionHeight: p.decimal(),
        dimensionUnit: p.string(),
        capabilities: p.json<string[]>(),
        weightCapacityGrams: p.integer(),
        status: p.enum(() => SectorStatus),
    },
});

class Sector extends SectorSchema.class {}

SectorSchema.setClass(Sector);

export { Sector, SectorSchema };
