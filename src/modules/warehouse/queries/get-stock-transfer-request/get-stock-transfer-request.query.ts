import { Query } from "@nestjs/cqrs";

export interface StockTransferRequestResponse {
    id: string;
    goodId: string;
    quantity: number;
    fromWarehouseId: string;
    toWarehouseId: string;
    status: string;
    note?: string;
    requestedBy?: string;
    rejectionReason?: string;
}

export class GetStockTransferRequestQuery extends Query<StockTransferRequestResponse> {
    constructor(public readonly requestId: string) {
        super();
    }
}
