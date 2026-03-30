import { Query } from "@nestjs/cqrs";
import { Paginated } from "../../../../libs/ports/repository.port.js";

export interface GoodsReceiptListItem {
    id: string;
    targetWarehouseId: string;
    status: string;
    note?: string;
    lineCount: number;
}

export type ListGoodsReceiptsResponse = Paginated<GoodsReceiptListItem>;

export class ListGoodsReceiptsQuery extends Query<ListGoodsReceiptsResponse> {
    constructor(
        public readonly page: number,
        public readonly limit: number,
    ) {
        super();
    }
}
