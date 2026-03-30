import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { VehicleAggregate } from "../domain/vehicle.aggregate.js";
import { VehicleStatus } from "../domain/vehicle-status.enum.js";
import { DriverLicenseCategory } from "../domain/driver-license-category.enum.js";
import { VehicleAttribute } from "../domain/vehicle-attribute.value-object.js";
import { Vehicle } from "./vehicle.entity.js";

@Injectable()
export class VehicleMapper implements Mapper<VehicleAggregate, RequiredEntityData<Vehicle>> {
    toDomain(record: Vehicle): VehicleAggregate {
        return VehicleAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                status: record.status as VehicleStatus,
                requiredLicenseCategory: record.requiredLicenseCategory as DriverLicenseCategory,
                attributes: (record.attributes ?? []).map(
                    (attr) => new VehicleAttribute({ name: attr.name, value: attr.value }),
                ),
                vin: record.vin ?? undefined,
                licensePlate: record.licensePlate ?? undefined,
                note: record.note ?? undefined,
                warehouseId: record.warehouseId ?? undefined,
            },
        });
    }

    toPersistence(domain: VehicleAggregate): RequiredEntityData<Vehicle> {
        return {
            id: domain.id as string,
            name: domain.name,
            status: domain.status,
            requiredLicenseCategory: domain.requiredLicenseCategory,
            attributes: domain.attributes.map((attr) => ({
                name: attr.name,
                value: attr.value,
            })),
            vin: domain.vin ?? null,
            licensePlate: domain.licensePlate ?? null,
            note: domain.note ?? null,
            warehouseId: domain.warehouseId ?? null,
        };
    }

    toResponse(entity: VehicleAggregate) {
        return entity.toJSON();
    }
}
