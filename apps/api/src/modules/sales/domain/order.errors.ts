import {
    BadRequestDomainException,
    ConflictDomainException,
    NotFoundDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class OrderIsNotEditableError extends ConflictDomainException {
    static readonly message = "error_order_edit_forbidden";
    public readonly code = "ORDER.EDIT.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderIsNotEditableError.message, cause, metadata);
    }
}

export class OrderHasOrderLinesWithoutItems extends BadRequestDomainException {
    static readonly message = "error_order_orderline_without_items";
    public readonly code = "ORDER.ORDERLINE.WITHOUT.ITEMS";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderHasOrderLinesWithoutItems.message, cause, metadata);
    }
}

export class CustomerNotFoundForOrderError extends NotFoundDomainException {
    static readonly message = "error_order_customer_not_found";
    public readonly code = "ORDER.CUSTOMER.NOT_FOUND";

    constructor(customerId: string, cause?: Error) {
        super(CustomerNotFoundForOrderError.message, cause, { customerId });
    }
}

export class PriceNotFoundForOrderLineError extends BadRequestDomainException {
    static readonly message = "error_order_orderline_price_not_found";
    public readonly code = "ORDER.ORDERLINE.PRICE.NOT_FOUND";

    constructor(itemId: string, cause?: Error) {
        super(PriceNotFoundForOrderLineError.message, cause, { itemId });
    }
}

export class CannotChangeQuantityOfPlacedOrderError extends ConflictDomainException {
    static readonly message = "error_order_quantity_edit_forbidden";
    public readonly code = "ORDER.QUANTITY.EDIT.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(CannotChangeQuantityOfPlacedOrderError.message, cause, metadata);
    }
}

export class OrderNotFoundError extends NotFoundDomainException {
    static readonly message = "error_order_not_found";
    public readonly code = "ORDER.NOT_FOUND";

    constructor(orderId: string, cause?: Error) {
        super(OrderNotFoundError.message, cause, { orderId });
    }
}

export class GoodNotFoundForAssignmentError extends NotFoundDomainException {
    static readonly message = "error_order_good_not_found";
    public readonly code = "ORDER.GOOD.NOT_FOUND";

    constructor(goodId: string, cause?: Error) {
        super(GoodNotFoundForAssignmentError.message, cause, { goodId });
    }
}

export class OrderCannotBePlacedError extends ConflictDomainException {
    static readonly message = "error_order_place_forbidden";
    public readonly code = "ORDER.PLACE.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderCannotBePlacedError.message, cause, metadata);
    }
}

export class OrderCannotBeCancelledError extends ConflictDomainException {
    static readonly message = "error_order_cancel_forbidden";
    public readonly code = "ORDER.CANCEL.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderCannotBeCancelledError.message, cause, metadata);
    }
}

export class OrderLineNotFoundError extends NotFoundDomainException {
    static readonly message = "error_order_orderline_not_found";
    public readonly code = "ORDER.ORDERLINE.NOT_FOUND";

    constructor(productId: string, cause?: Error) {
        super(OrderLineNotFoundError.message, cause, { productId });
    }
}

export class OrderCannotBeCompletedError extends ConflictDomainException {
    static readonly message = "error_order_complete_forbidden";
    public readonly code = "ORDER.COMPLETE.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderCannotBeCompletedError.message, cause, metadata);
    }
}

export class StockEntryAlreadyAssignedError extends ConflictDomainException {
    static readonly message = "error_order_stock_entry_already_assigned";
    public readonly code = "ORDER.STOCK_ENTRY.ALREADY_ASSIGNED";

    constructor(stockEntryId: string, cause?: Error) {
        super(StockEntryAlreadyAssignedError.message, cause, { stockEntryId });
    }
}

export class StockEntryNotFoundForAssignmentError extends NotFoundDomainException {
    static readonly message = "error_order_stock_entry_not_found";
    public readonly code = "ORDER.STOCK_ENTRY.NOT_FOUND";

    constructor(stockEntryId: string, cause?: Error) {
        super(StockEntryNotFoundForAssignmentError.message, cause, { stockEntryId });
    }
}

export class StockEntryGoodMismatchError extends BadRequestDomainException {
    static readonly message = "error_order_stock_entry_good_mismatch";
    public readonly code = "ORDER.STOCK_ENTRY.GOOD_MISMATCH";

    constructor(stockEntryId: string, cause?: Error) {
        super(StockEntryGoodMismatchError.message, cause, { stockEntryId });
    }
}

export class OrderLineHasNoGoodError extends BadRequestDomainException {
    static readonly message = "error_order_orderline_no_good";
    public readonly code = "ORDER.ORDERLINE.NO_GOOD";

    constructor(productId: string, cause?: Error) {
        super(OrderLineHasNoGoodError.message, cause, { productId });
    }
}

export class CannotAssignStockEntryError extends ConflictDomainException {
    static readonly message = "error_order_stock_entry_assign_forbidden";
    public readonly code = "ORDER.STOCK_ENTRY.ASSIGN.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(CannotAssignStockEntryError.message, cause, metadata);
    }
}
