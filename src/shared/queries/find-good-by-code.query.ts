/**
 * Cross-module read contract: any module can scan a code value (barcode, QR, etc.)
 * to identify which good it belongs to.
 * Warehouse module registers the handler.
 */
export class FindGoodByCodeQuery {
    constructor(public readonly value: string) {}
}

export interface FindGoodByCodeResponse {
    goodId: string;
    goodName: string;
    codeId: string;
    codeType: string;
    codeValue: string;
}
