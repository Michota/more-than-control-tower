import { defineEntity, p } from "@mikro-orm/core";
import { VehicleStatus } from "../domain/vehicle-status.enum.js";
import { DriverLicenseCategory } from "../domain/driver-license-category.enum.js";
import { VehicleAttributeRecord } from "./vehicle-attribute.embeddable.js";

const VehicleSchema = defineEntity({
    name: "Vehicle",
    tableName: "vehicle",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        status: p.enum(() => VehicleStatus),
        requiredLicenseCategory: p.enum(() => DriverLicenseCategory),
        attributes: p.embedded(VehicleAttributeRecord).array().default([]),
        vin: p.string().nullable(),
        licensePlate: p.string().nullable(),
        note: p.string().nullable(),
        warehouseId: p.uuid().nullable(),
    },
});

class Vehicle extends VehicleSchema.class {}

VehicleSchema.setClass(Vehicle);

export { Vehicle, VehicleSchema };
