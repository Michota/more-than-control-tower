import { Query } from "@nestjs/cqrs";
import { Paginated } from "../../../../libs/ports/repository.port.js";
import { StockTransferRequestStatus } from "../../domain/stock-transfer-request-status.enum.js";

export interface StockTransferRequestListItem {
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

export type ListStockTransferRequestsResponse = Paginated<StockTransferRequestListItem>;

export class ListStockTransferRequestsQuery extends Query<ListStockTransferRequestsResponse> {
    constructor(
        public readonly status: StockTransferRequestStatus | undefined,
        public readonly fromWarehouseId: string | undefined,
        public readonly toWarehouseId: string | undefined,
        public readonly page: number,
        public readonly limit: number,
    ) {
        super();
    }
}
