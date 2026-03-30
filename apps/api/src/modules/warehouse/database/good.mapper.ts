import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { GoodAggregate } from "../domain/good.aggregate.js";
import { GoodDimensions, DimensionUnit } from "../domain/good-dimensions.value-object.js";
import { GoodWeight, WeightUnit } from "../domain/good-weight.value-object.js";
import { Good } from "./good.entity.js";

@Injectable()
export class GoodMapper implements Mapper<GoodAggregate, RequiredEntityData<Good>> {
    toDomain(record: Good): GoodAggregate {
        return GoodAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                description: record.description ?? undefined,
                weight: new GoodWeight({
                    value: Number(record.weightValue),
                    unit: record.weightUnit as WeightUnit,
                }),
                dimensions: new GoodDimensions({
                    length: Number(record.dimensionLength),
                    width: Number(record.dimensionWidth),
                    height: Number(record.dimensionHeight),
                    unit: record.dimensionUnit as DimensionUnit,
                }),
                parentId: record.parentId ?? undefined,
            },
        });
    }

    toPersistence(domain: GoodAggregate): RequiredEntityData<Good> {
        return {
            id: domain.id as string,
            name: domain.name,
            description: domain.description,
            weightValue: String(domain.weight.value),
            weightUnit: domain.weight.unit,
            dimensionLength: String(domain.dimensions.length),
            dimensionWidth: String(domain.dimensions.width),
            dimensionHeight: String(domain.dimensions.height),
            dimensionUnit: domain.dimensions.unit,
            parentId: domain.parentId ?? null,
        };
    }

    toResponse(entity: GoodAggregate): unknown {
        return entity.toJSON();
    }
}
