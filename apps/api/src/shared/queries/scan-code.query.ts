/**
 * Cross-module read contract: scan a code value in the context of a specific
 * warehouse and resolve directly to the stock entry.
 *
 * Primary use case: RSR scans a barcode on their vehicle (mobile warehouse)
 * and gets the stock entry for order creation in one call.
 *
 * Warehouse module registers the handler.
 */
export class ScanCodeQuery {
    constructor(
        public readonly value: string,
        public readonly warehouseId: string,
    ) {}
}

export interface ScanCodeResponse {
    stockEntryId: string;
    goodId: string;
    goodName: string;
    warehouseId: string;
    quantity: number;
    codeType: string;
    codeValue: string;
}
