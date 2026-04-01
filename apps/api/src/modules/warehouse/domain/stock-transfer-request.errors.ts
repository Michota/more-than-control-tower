import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class StockTransferRequestNotFoundError extends NotFoundDomainException {
    static readonly message = "error_stock_transfer_request_not_found";
    public readonly code = "STOCK_TRANSFER_REQUEST.NOT_FOUND";

    constructor(id: string) {
        super(StockTransferRequestNotFoundError.message, undefined, { id });
    }
}

export class StockTransferRequestNotPendingError extends ConflictDomainException {
    static readonly message = "error_stock_transfer_request_not_pending";
    public readonly code = "STOCK_TRANSFER_REQUEST.NOT_PENDING";

    constructor() {
        super(StockTransferRequestNotPendingError.message);
    }
}
