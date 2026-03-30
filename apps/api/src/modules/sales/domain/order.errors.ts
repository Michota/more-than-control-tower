import {
    BadRequestDomainException,
    ConflictDomainException,
    NotFoundDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class OrderIsNotEditableError extends ConflictDomainException {
    static readonly message = "This order can't be modified.";
    public readonly code = "ORDER.EDIT.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderIsNotEditableError.message, cause, metadata);
    }
}

export class OrderHasOrderLinesWithoutItems extends BadRequestDomainException {
    static readonly message = "Order has order lines without items.";
    public readonly code = "ORDER.ORDERLINE.WITHOUT.ITEMS";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderHasOrderLinesWithoutItems.message, cause, metadata);
    }
}

export class CustomerNotFoundForOrderError extends NotFoundDomainException {
    static readonly message = "Customer not found in CRM.";
    public readonly code = "ORDER.CUSTOMER.NOT_FOUND";

    constructor(customerId: string, cause?: Error) {
        super(`${CustomerNotFoundForOrderError.message} customerId: ${customerId}`, cause);
    }
}

export class PriceNotFoundForOrderLineError extends BadRequestDomainException {
    static readonly message = "Could not resolve a price for order line.";
    public readonly code = "ORDER.ORDERLINE.PRICE.NOT_FOUND";

    constructor(itemId: string, cause?: Error) {
        super(`${PriceNotFoundForOrderLineError.message} itemId: ${itemId}`, cause);
    }
}

export class CannotChangeQuantityOfPlacedOrderError extends ConflictDomainException {
    static readonly message: "Can't edit quantity of placed order";
    public readonly code = "ORDER.QUANTITY.EDIT.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(CannotChangeQuantityOfPlacedOrderError.message, cause, metadata);
    }
}

export class OrderNotFoundError extends NotFoundDomainException {
    static readonly message = "Order not found.";
    public readonly code = "ORDER.NOT_FOUND";

    constructor(orderId: string, cause?: Error) {
        super(`${OrderNotFoundError.message} orderId: ${orderId}`, cause);
    }
}

export class GoodNotFoundForAssignmentError extends NotFoundDomainException {
    static readonly message = "Good not found in warehouse.";
    public readonly code = "ORDER.GOOD.NOT_FOUND";

    constructor(goodId: string, cause?: Error) {
        super(`${GoodNotFoundForAssignmentError.message} goodId: ${goodId}`, cause);
    }
}

export class OrderCannotBePlacedError extends ConflictDomainException {
    static readonly message = "Order can only be placed from DRAFTED status.";
    public readonly code = "ORDER.PLACE.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderCannotBePlacedError.message, cause, metadata);
    }
}

export class OrderCannotBeCancelledError extends ConflictDomainException {
    static readonly message = "Order can only be cancelled from DRAFTED or PLACED status.";
    public readonly code = "ORDER.CANCEL.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderCannotBeCancelledError.message, cause, metadata);
    }
}

export class OrderLineNotFoundError extends NotFoundDomainException {
    static readonly message = "Order line not found for the given product.";
    public readonly code = "ORDER.ORDERLINE.NOT_FOUND";

    constructor(productId: string, cause?: Error) {
        super(`${OrderLineNotFoundError.message} productId: ${productId}`, cause);
    }
}

export class OrderCannotBeCompletedError extends ConflictDomainException {
    static readonly message = "Order can only be completed from PLACED or IN_PROGRESS status.";
    public readonly code = "ORDER.COMPLETE.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderCannotBeCompletedError.message, cause, metadata);
    }
}

export class StockEntryAlreadyAssignedError extends ConflictDomainException {
    static readonly message = "Stock entry is already assigned to another active order.";
    public readonly code = "ORDER.STOCK_ENTRY.ALREADY_ASSIGNED";

    constructor(stockEntryId: string, cause?: Error) {
        super(`${StockEntryAlreadyAssignedError.message} stockEntryId: ${stockEntryId}`, cause);
    }
}

export class StockEntryNotFoundForAssignmentError extends NotFoundDomainException {
    static readonly message = "Stock entry not found.";
    public readonly code = "ORDER.STOCK_ENTRY.NOT_FOUND";

    constructor(stockEntryId: string, cause?: Error) {
        super(`${StockEntryNotFoundForAssignmentError.message} stockEntryId: ${stockEntryId}`, cause);
    }
}

export class StockEntryGoodMismatchError extends BadRequestDomainException {
    static readonly message = "Stock entry's good does not match the order line's assigned good.";
    public readonly code = "ORDER.STOCK_ENTRY.GOOD_MISMATCH";

    constructor(stockEntryId: string, cause?: Error) {
        super(`${StockEntryGoodMismatchError.message} stockEntryId: ${stockEntryId}`, cause);
    }
}

export class OrderLineHasNoGoodError extends BadRequestDomainException {
    static readonly message = "Order line must have a good assigned before a stock entry can be assigned.";
    public readonly code = "ORDER.ORDERLINE.NO_GOOD";

    constructor(productId: string, cause?: Error) {
        super(`${OrderLineHasNoGoodError.message} productId: ${productId}`, cause);
    }
}

export class CannotAssignStockEntryError extends ConflictDomainException {
    static readonly message = "Stock entries can only be assigned to PLACED orders.";
    public readonly code = "ORDER.STOCK_ENTRY.ASSIGN.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(CannotAssignStockEntryError.message, cause, metadata);
    }
}
