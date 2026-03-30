import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { StockTransferRequestRepositoryPort } from "../../database/stock-transfer-request.repository.port.js";
import { StockTransferRequestNotFoundError } from "../../domain/stock-transfer-request.errors.js";
import { STOCK_TRANSFER_REQUEST_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { GetStockTransferRequestQuery, StockTransferRequestResponse } from "./get-stock-transfer-request.query.js";

@QueryHandler(GetStockTransferRequestQuery)
export class GetStockTransferRequestQueryHandler implements IQueryHandler<
    GetStockTransferRequestQuery,
    StockTransferRequestResponse
> {
    constructor(
        @Inject(STOCK_TRANSFER_REQUEST_REPOSITORY_PORT)
        private readonly requestRepo: StockTransferRequestRepositoryPort,
    ) {}

    async execute(query: GetStockTransferRequestQuery): Promise<StockTransferRequestResponse> {
        const request = await this.requestRepo.findOneById(query.requestId);
        if (!request) {
            throw new StockTransferRequestNotFoundError(query.requestId);
        }

        return {
            id: request.id as string,
            goodId: request.goodId,
            quantity: request.quantity,
            fromWarehouseId: request.fromWarehouseId,
            toWarehouseId: request.toWarehouseId,
            status: request.status,
            note: request.note,
            requestedBy: request.requestedBy,
            rejectionReason: request.rejectionReason,
        };
    }
}
