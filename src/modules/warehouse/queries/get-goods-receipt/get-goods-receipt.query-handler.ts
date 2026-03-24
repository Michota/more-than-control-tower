import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { GoodsReceiptRepositoryPort } from "../../database/goods-receipt.repository.port.js";
import { GoodsReceiptNotFoundError } from "../../domain/good.errors.js";
import { GOODS_RECEIPT_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { GetGoodsReceiptQuery, GoodsReceiptResponse } from "./get-goods-receipt.query.js";

@QueryHandler(GetGoodsReceiptQuery)
export class GetGoodsReceiptQueryHandler implements IQueryHandler<GetGoodsReceiptQuery, GoodsReceiptResponse> {
    constructor(
        @Inject(GOODS_RECEIPT_REPOSITORY_PORT)
        private readonly receiptRepo: GoodsReceiptRepositoryPort,
    ) {}

    async execute(query: GetGoodsReceiptQuery): Promise<GoodsReceiptResponse> {
        const receipt = await this.receiptRepo.findOneById(query.receiptId);
        if (!receipt) {
            throw new GoodsReceiptNotFoundError(query.receiptId);
        }

        return {
            id: receipt.id as string,
            targetWarehouseId: receipt.targetWarehouseId,
            status: receipt.status,
            note: receipt.note,
            lines: receipt.lines.map((line) => ({
                goodId: line.goodId,
                quantity: line.quantity,
                locationDescription: line.locationDescription,
                note: line.note,
            })),
        };
    }
}
