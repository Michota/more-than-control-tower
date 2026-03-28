import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { StockTransferRequestAggregate } from "../domain/stock-transfer-request.aggregate.js";
import { StockTransferRequestStatus } from "../domain/stock-transfer-request-status.enum.js";
import { StockTransferRequest } from "./stock-transfer-request.entity.js";

@Injectable()
export class StockTransferRequestMapper implements Mapper<
    StockTransferRequestAggregate,
    RequiredEntityData<StockTransferRequest>
> {
    toDomain(record: StockTransferRequest): StockTransferRequestAggregate {
        return StockTransferRequestAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                goodId: record.goodId,
                quantity: record.quantity,
                fromWarehouseId: record.fromWarehouseId,
                toWarehouseId: record.toWarehouseId,
                status: record.status as StockTransferRequestStatus,
                note: record.note ?? undefined,
                requestedBy: record.requestedBy ?? undefined,
                rejectionReason: record.rejectionReason ?? undefined,
            },
        });
    }

    toPersistence(domain: StockTransferRequestAggregate): RequiredEntityData<StockTransferRequest> {
        return {
            id: domain.id as string,
            goodId: domain.goodId,
            quantity: domain.quantity,
            fromWarehouseId: domain.fromWarehouseId,
            toWarehouseId: domain.toWarehouseId,
            status: domain.status,
            note: domain.note ?? null,
            requestedBy: domain.requestedBy ?? null,
            rejectionReason: domain.rejectionReason ?? null,
        };
    }

    toResponse(entity: StockTransferRequestAggregate): unknown {
        return entity.toJSON();
    }
}
