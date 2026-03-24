import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Paginated } from "../../../../libs/ports/repository.port.js";
import type { GoodsReceiptRepositoryPort } from "../../database/goods-receipt.repository.port.js";
import { GOODS_RECEIPT_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ListGoodsReceiptsQuery, ListGoodsReceiptsResponse } from "./list-goods-receipts.query.js";

@QueryHandler(ListGoodsReceiptsQuery)
export class ListGoodsReceiptsQueryHandler implements IQueryHandler<ListGoodsReceiptsQuery, ListGoodsReceiptsResponse> {
    constructor(
        @Inject(GOODS_RECEIPT_REPOSITORY_PORT)
        private readonly receiptRepo: GoodsReceiptRepositoryPort,
    ) {}

    async execute(query: ListGoodsReceiptsQuery): Promise<ListGoodsReceiptsResponse> {
        const result = await this.receiptRepo.findAllPaginated({
            page: query.page,
            limit: query.limit,
            offset: (query.page - 1) * query.limit,
            orderBy: { field: "id", direction: "desc" },
        });

        return new Paginated({
            data: result.data.map((r) => ({
                id: r.id as string,
                targetWarehouseId: r.targetWarehouseId,
                status: r.status,
                note: r.note,
                lineCount: r.lines.length,
            })),
            count: result.count,
            limit: result.limit,
            page: result.page,
        });
    }
}
