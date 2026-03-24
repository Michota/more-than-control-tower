import { Query } from "@nestjs/cqrs";

export interface StockHistoryItemResponse {
    eventType: string;
    quantityDelta: number;
    quantityAfter: number;
    note?: string;
    removalReason?: string;
    relatedWarehouseId?: string;
    relatedSectorId?: string;
    occurredAt: string;
}

export interface StockAttributeResponse {
    name: string;
    type: string;
    value: string;
}

export interface WarehouseStockItem {
    id: string;
    goodId: string;
    goodName: string;
    goodDescription?: string;
    quantity: number;
    sectorId?: string;
    attributes: StockAttributeResponse[];
    receivedAt: string;
    history?: StockHistoryItemResponse[];
}

export interface ListWarehouseStockParams {
    warehouseId: string;
    includeHistory?: boolean;
    sectorId?: string;
    goodName?: string;
    goodDescription?: string;
    sortBy?: "name" | "receivedAt";
    sortDirection?: "asc" | "desc";
    attributeName?: string;
    attributeValue?: string;
    attributeDateBefore?: string;
}

export type ListWarehouseStockResponse = WarehouseStockItem[];

export class ListWarehouseStockQuery extends Query<ListWarehouseStockResponse> {
    constructor(public readonly params: ListWarehouseStockParams) {
        super();
    }
}
