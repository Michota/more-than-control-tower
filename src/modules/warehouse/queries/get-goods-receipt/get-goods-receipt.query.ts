import { Query } from "@nestjs/cqrs";

export interface GoodsReceiptLineResponse {
    goodId: string;
    quantity: number;
    locationDescription?: string;
    note?: string;
}

export interface GoodsReceiptResponse {
    id: string;
    targetWarehouseId: string;
    status: string;
    note?: string;
    lines: GoodsReceiptLineResponse[];
}

export class GetGoodsReceiptQuery extends Query<GoodsReceiptResponse> {
    constructor(public readonly receiptId: string) {
        super();
    }
}
