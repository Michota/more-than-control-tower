import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { Address } from "../../../shared/value-objects/address.value-object.js";
import { WarehouseAggregate } from "../domain/warehouse.aggregate.js";
import { WarehouseStatus } from "../domain/warehouse-status.enum.js";
import { WarehouseType } from "../domain/warehouse-type.enum.js";
import { Warehouse } from "./warehouse.entity.js";

@Injectable()
export class WarehouseMapper implements Mapper<WarehouseAggregate, RequiredEntityData<Warehouse>> {
    toDomain(record: Warehouse): WarehouseAggregate {
        return WarehouseAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                address: new Address({
                    country: record.addressCountry,
                    postalCode: record.addressPostalCode,
                    state: record.addressState,
                    city: record.addressCity,
                    street: record.addressStreet,
                }),
                status: record.status as WarehouseStatus,
                type: record.type as WarehouseType,
            },
        });
    }

    toPersistence(domain: WarehouseAggregate): RequiredEntityData<Warehouse> {
        return {
            id: domain.id as string,
            name: domain.name,
            addressCountry: domain.address.country,
            addressPostalCode: domain.address.postalCode,
            addressState: domain.address.state,
            addressCity: domain.address.city,
            addressStreet: domain.address.street,
            status: domain.status,
            type: domain.type,
        };
    }

    toResponse(entity: WarehouseAggregate) {
        return entity.toJSON();
    }
}
