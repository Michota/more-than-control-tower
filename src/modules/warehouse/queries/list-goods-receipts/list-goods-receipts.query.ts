import { Paginated } from "../../../../libs/ports/repository.port.js";

export interface GoodsReceiptListItem {
    id: string;
    targetWarehouseId: string;
    status: string;
    note?: string;
    lineCount: number;
}

export class ListGoodsReceiptsQuery {
    constructor(
        public readonly page: number,
        public readonly limit: number,
    ) {}
}

export type ListGoodsReceiptsResponse = Paginated<GoodsReceiptListItem>;
