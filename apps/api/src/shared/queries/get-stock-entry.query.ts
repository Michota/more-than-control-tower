/**
 * Cross-module read contract: Sales sends this query to verify a stock entry
 * exists and get its details for order assignment validation.
 * Warehouse module registers the handler.
 */
export class GetStockEntryQuery {
    constructor(public readonly stockEntryId: string) {}
}

export interface StockEntryResponse {
    id: string;
    goodId: string;
    warehouseId: string;
    quantity: number;
}

export type GetStockEntryResponse = StockEntryResponse | null;
