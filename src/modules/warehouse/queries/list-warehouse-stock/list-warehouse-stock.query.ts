export interface WarehouseStockItem {
    id: string;
    goodId: string;
    quantity: number;
    locationDescription?: string;
}

export class ListWarehouseStockQuery {
    constructor(public readonly warehouseId: string) {}
}

export type ListWarehouseStockResponse = WarehouseStockItem[];
