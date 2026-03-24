import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { GoodAggregate } from "../domain/good.aggregate.js";
import { GoodDimensions, DimensionUnit } from "../domain/good-dimensions.value-object.js";
import { GoodHistoryEntry as DomainHistoryEntry } from "../domain/good-history-entry.value-object.js";
import { GoodHistoryEventType } from "../domain/good-history-event-type.enum.js";
import { GoodRemovalReason } from "../domain/good-removal-reason.enum.js";
import { GoodWeight, WeightUnit } from "../domain/good-weight.value-object.js";
import { WarehouseLocation } from "../domain/warehouse-location.value-object.js";
import { Good } from "./good.entity.js";
import { GoodHistoryEntry as OrmHistoryEntry } from "./good-history.embeddable.js";

@Injectable()
export class GoodMapper implements Mapper<GoodAggregate, RequiredEntityData<Good>> {
    toDomain(record: Good): GoodAggregate {
        const weight = new GoodWeight({
            value: Number(record.weightValue),
            unit: record.weightUnit as WeightUnit,
        });

        const dimensions = new GoodDimensions({
            length: Number(record.dimensionLength),
            width: Number(record.dimensionWidth),
            height: Number(record.dimensionHeight),
            unit: record.dimensionUnit as DimensionUnit,
        });

        const locationInWarehouse = record.locationInWarehouse
            ? new WarehouseLocation({ description: record.locationInWarehouse })
            : undefined;

        const history = record.history.map(
            (h: OrmHistoryEntry) =>
                new DomainHistoryEntry({
                    eventType: h.eventType as GoodHistoryEventType,
                    note: h.note ?? undefined,
                    removalReason: h.removalReason ? (h.removalReason as GoodRemovalReason) : undefined,
                    fromWarehouseId: h.fromWarehouseId ?? undefined,
                    toWarehouseId: h.toWarehouseId ?? undefined,
                    occurredAt: new Date(h.occurredAt),
                }),
        );

        return GoodAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                description: record.description ?? undefined,
                weight,
                dimensions,
                warehouseId: record.warehouseId ?? undefined,
                locationInWarehouse,
                parentId: record.parentId ?? undefined,
                history,
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
            warehouseId: domain.warehouseId ?? null,
            locationInWarehouse: domain.locationInWarehouse?.description ?? null,
            parentId: domain.parentId ?? null,
            history: domain.history.map((h) => ({
                eventType: h.eventType,
                note: h.note ?? null,
                removalReason: h.removalReason ?? null,
                fromWarehouseId: h.fromWarehouseId ?? null,
                toWarehouseId: h.toWarehouseId ?? null,
                occurredAt: h.occurredAt,
            })) as unknown as RequiredEntityData<Good>["history"],
        };
    }

    toResponse(entity: GoodAggregate): unknown {
        return entity.toJSON();
    }
}
