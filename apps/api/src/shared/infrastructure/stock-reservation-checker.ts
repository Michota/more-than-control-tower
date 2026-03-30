/**
 * Plugin interface for modules that reserve stock entries.
 * Any module that assigns stock entries to its domain objects should
 * implement this interface and register it as a provider.
 *
 * The aggregated CanStockEntryBeModifiedQuery handler iterates all
 * registered checkers to determine if a stock entry can be modified.
 */
export interface StockReservationChecker {
    isStockEntryReserved(stockEntryId: string): Promise<{ reserved: boolean; reason?: string }>;
}

export const STOCK_RESERVATION_CHECKERS = Symbol("StockReservationCheckers");
