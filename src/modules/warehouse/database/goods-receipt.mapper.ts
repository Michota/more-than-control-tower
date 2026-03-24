import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { GoodsReceiptAggregate } from "../domain/goods-receipt.aggregate.js";
import { GoodsReceiptLine as DomainLine } from "../domain/goods-receipt-line.value-object.js";
import { GoodsReceiptStatus } from "../domain/goods-receipt-status.enum.js";
import { GoodsReceipt } from "./goods-receipt.entity.js";
import { GoodsReceiptLine as OrmLine } from "./goods-receipt-line.embeddable.js";

@Injectable()
export class GoodsReceiptMapper implements Mapper<GoodsReceiptAggregate, RequiredEntityData<GoodsReceipt>> {
    toDomain(record: GoodsReceipt): GoodsReceiptAggregate {
        const lines = record.lines.map(
            (l: OrmLine) =>
                new DomainLine({
                    goodId: l.goodId,
                    quantity: l.quantity,
                    locationDescription: l.locationDescription ?? undefined,
                    note: l.note ?? undefined,
                }),
        );

        return GoodsReceiptAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                targetWarehouseId: record.targetWarehouseId,
                lines,
                note: record.note ?? undefined,
                status: record.status as GoodsReceiptStatus,
            },
        });
    }

    toPersistence(domain: GoodsReceiptAggregate): RequiredEntityData<GoodsReceipt> {
        return {
            id: domain.id as string,
            targetWarehouseId: domain.targetWarehouseId,
            note: domain.note ?? null,
            status: domain.status,
            lines: domain.lines.map((l) => ({
                goodId: l.goodId,
                quantity: l.quantity,
                locationDescription: l.locationDescription ?? null,
                note: l.note ?? null,
            })) as unknown as RequiredEntityData<GoodsReceipt>["lines"],
        };
    }

    toResponse(entity: GoodsReceiptAggregate): unknown {
        return entity.toJSON();
    }
}
