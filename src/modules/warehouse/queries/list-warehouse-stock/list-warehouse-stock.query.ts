import { Query } from "@nestjs/cqrs";

export interface WarehouseStockItem {
    id: string;
    goodId: string;
    quantity: number;
    locationDescription?: string;
}

export type ListWarehouseStockResponse = WarehouseStockItem[];

export class ListWarehouseStockQuery extends Query<ListWarehouseStockResponse> {
    constructor(public readonly warehouseId: string) {
        super();
    }
}
