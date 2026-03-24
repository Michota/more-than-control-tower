import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { SectorAggregate } from "../domain/sector.aggregate.js";
import { SectorDimensions } from "../domain/sector-dimensions.value-object.js";
import { DimensionUnit } from "../domain/good-dimensions.value-object.js";
import { SectorCapability } from "../domain/sector-capability.enum.js";
import { SectorStatus } from "../domain/sector-status.enum.js";
import { Sector } from "./sector.entity.js";

@Injectable()
export class SectorMapper implements Mapper<SectorAggregate, RequiredEntityData<Sector>> {
    toDomain(record: Sector): SectorAggregate {
        return SectorAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                description: record.description ?? undefined,
                warehouseId: record.warehouseId,
                dimensions: new SectorDimensions({
                    length: Number(record.dimensionLength),
                    width: Number(record.dimensionWidth),
                    height: Number(record.dimensionHeight),
                    unit: record.dimensionUnit as DimensionUnit,
                }),
                capabilities: record.capabilities as SectorCapability[],
                weightCapacityGrams: record.weightCapacityGrams,
                status: record.status as SectorStatus,
            },
        });
    }

    toPersistence(domain: SectorAggregate): RequiredEntityData<Sector> {
        return {
            id: domain.id as string,
            name: domain.name,
            description: domain.description ?? null,
            warehouseId: domain.warehouseId,
            dimensionLength: String(domain.dimensions.length),
            dimensionWidth: String(domain.dimensions.width),
            dimensionHeight: String(domain.dimensions.height),
            dimensionUnit: domain.dimensions.unit,
            capabilities: domain.capabilities,
            weightCapacityGrams: domain.weightCapacityGrams,
            status: domain.status,
        };
    }

    toResponse(entity: SectorAggregate) {
        return entity.toJSON();
    }
}
