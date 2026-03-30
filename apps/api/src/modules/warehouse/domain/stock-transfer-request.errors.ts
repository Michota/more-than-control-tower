import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class StockTransferRequestNotFoundError extends NotFoundDomainException {
    public readonly code = "STOCK_TRANSFER_REQUEST.NOT_FOUND";

    constructor(id: string) {
        super(`Stock transfer request with id ${id} not found`);
    }
}

export class StockTransferRequestNotPendingError extends ConflictDomainException {
    public readonly code = "STOCK_TRANSFER_REQUEST.NOT_PENDING";

    constructor() {
        super("Stock transfer request can only be fulfilled, cancelled, or rejected while in PENDING status");
    }
}
