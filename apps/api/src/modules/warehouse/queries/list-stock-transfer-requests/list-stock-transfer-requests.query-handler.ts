import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { StockTransferRequestRepositoryPort } from "../../database/stock-transfer-request.repository.port.js";
import { STOCK_TRANSFER_REQUEST_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import {
    ListStockTransferRequestsQuery,
    ListStockTransferRequestsResponse,
} from "./list-stock-transfer-requests.query.js";

@QueryHandler(ListStockTransferRequestsQuery)
export class ListStockTransferRequestsQueryHandler implements IQueryHandler<
    ListStockTransferRequestsQuery,
    ListStockTransferRequestsResponse
> {
    constructor(
        @Inject(STOCK_TRANSFER_REQUEST_REPOSITORY_PORT)
        private readonly requestRepo: StockTransferRequestRepositoryPort,
    ) {}

    async execute(query: ListStockTransferRequestsQuery): Promise<ListStockTransferRequestsResponse> {
        const result = await this.requestRepo.findFiltered({
            status: query.status,
            fromWarehouseId: query.fromWarehouseId,
            toWarehouseId: query.toWarehouseId,
            page: query.page,
            limit: query.limit,
        });

        return {
            ...result,
            data: result.data.map((r) => ({
                id: r.id as string,
                goodId: r.goodId,
                quantity: r.quantity,
                fromWarehouseId: r.fromWarehouseId,
                toWarehouseId: r.toWarehouseId,
                status: r.status,
                note: r.note,
                requestedBy: r.requestedBy,
                rejectionReason: r.rejectionReason,
            })),
        };
    }
}
