import { defineEntity, p } from "@mikro-orm/core";
import { StockTransferRequestStatus } from "../domain/stock-transfer-request-status.enum.js";

const StockTransferRequestSchema = defineEntity({
    name: "StockTransferRequest",
    tableName: "stock_transfer_request",
    properties: {
        id: p.uuid().primary(),
        goodId: p.uuid(),
        quantity: p.integer(),
        fromWarehouseId: p.uuid(),
        toWarehouseId: p.uuid(),
        status: p.enum(() => StockTransferRequestStatus),
        note: p.string().nullable(),
        requestedBy: p.string().nullable(),
        rejectionReason: p.string().nullable(),
    },
});

class StockTransferRequest extends StockTransferRequestSchema.class {}

StockTransferRequestSchema.setClass(StockTransferRequest);

export { StockTransferRequest, StockTransferRequestSchema };
