import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { StockEntryAggregate } from "../domain/stock-entry.aggregate.js";
import { StockHistoryEntry as DomainHistoryEntry } from "../domain/stock-history-entry.value-object.js";
import { StockEventType } from "../domain/stock-event-type.enum.js";
import { StockRemovalReason } from "../domain/stock-removal-reason.enum.js";
import { WarehouseLocation } from "../domain/warehouse-location.value-object.js";
import { StockEntry } from "./stock-entry.entity.js";
import { StockHistoryEntry as OrmHistoryEntry } from "./stock-history.embeddable.js";

@Injectable()
export class StockEntryMapper implements Mapper<StockEntryAggregate, RequiredEntityData<StockEntry>> {
    toDomain(record: StockEntry): StockEntryAggregate {
        const history = record.history.map(
            (h: OrmHistoryEntry) =>
                new DomainHistoryEntry({
                    eventType: h.eventType as StockEventType,
                    quantityDelta: h.quantityDelta,
                    quantityAfter: h.quantityAfter,
                    note: h.note ?? undefined,
                    removalReason: h.removalReason ? (h.removalReason as StockRemovalReason) : undefined,
                    relatedWarehouseId: h.relatedWarehouseId ?? undefined,
                    occurredAt: new Date(h.occurredAt),
                }),
        );

        return StockEntryAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                goodId: record.goodId,
                warehouseId: record.warehouseId,
                locationInWarehouse: record.locationInWarehouse
                    ? new WarehouseLocation({ description: record.locationInWarehouse })
                    : undefined,
                quantity: record.quantity,
                history,
            },
        });
    }

    toPersistence(domain: StockEntryAggregate): RequiredEntityData<StockEntry> {
        return {
            id: domain.id as string,
            goodId: domain.goodId,
            warehouseId: domain.warehouseId,
            locationInWarehouse: domain.locationInWarehouse?.description ?? null,
            quantity: domain.quantity,
            history: domain.history.map((h) => ({
                eventType: h.eventType,
                quantityDelta: h.quantityDelta,
                quantityAfter: h.quantityAfter,
                note: h.note ?? null,
                removalReason: h.removalReason ?? null,
                relatedWarehouseId: h.relatedWarehouseId ?? null,
                occurredAt: h.occurredAt,
            })) as unknown as RequiredEntityData<StockEntry>["history"],
        };
    }

    toResponse(entity: StockEntryAggregate) {
        return entity.toJSON();
    }
}
