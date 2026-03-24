import { Query } from "@nestjs/cqrs";

export interface WarehouseStockItem {
    id: string;
    goodId: string;
    quantity: number;
    sectorId?: string;
}

export type ListWarehouseStockResponse = WarehouseStockItem[];

export class ListWarehouseStockQuery extends Query<ListWarehouseStockResponse> {
    constructor(public readonly warehouseId: string) {
        super();
    }
}
