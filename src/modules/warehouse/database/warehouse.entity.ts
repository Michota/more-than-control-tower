import { defineEntity, p } from "@mikro-orm/core";
import { WarehouseStatus } from "../domain/warehouse-status.enum.js";
import { WarehouseType } from "../domain/warehouse-type.enum.js";

const WarehouseSchema = defineEntity({
    name: "Warehouse",
    tableName: "warehouse",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        latitude: p.decimal(),
        longitude: p.decimal(),
        addressCountry: p.string(),
        addressPostalCode: p.string(),
        addressState: p.string(),
        addressCity: p.string(),
        addressStreet: p.string(),
        status: p.enum(() => WarehouseStatus),
        type: p.enum(() => WarehouseType),
    },
});

class Warehouse extends WarehouseSchema.class {}

WarehouseSchema.setClass(Warehouse);

export { Warehouse, WarehouseSchema };
