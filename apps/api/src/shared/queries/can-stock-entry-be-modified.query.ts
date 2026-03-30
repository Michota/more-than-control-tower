/**
 * Cross-module query: Warehouse sends this before mutating a stock entry.
 * The handler iterates all registered StockReservationCheckers and returns
 * the first rejection, or allows the modification if no checker objects.
 */
export class CanStockEntryBeModifiedQuery {
    constructor(public readonly stockEntryId: string) {}
}

export interface CanStockEntryBeModifiedResponse {
    allowed: boolean;
    reason?: string;
}
