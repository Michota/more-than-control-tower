import { Exception } from "../../../libs/exceptions";

export class OrderIsNotEditableError extends Exception {
    static readonly message = "This order can't be modified.";
    public readonly code = "ORDER.EDIT.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderIsNotEditableError.message, cause, metadata);
    }
}

export class OrderHasOrderLinesWithoutItems extends Exception {
    static readonly message = "Order has order lines without items.";
    public readonly code = "ORDER.ORDERLINE.WITHOUT.ITEMS";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(OrderHasOrderLinesWithoutItems.message, cause, metadata);
    }
}

export class CustomerNotFoundForOrderError extends Exception {
    static readonly message = "Customer not found in CRM.";
    public readonly code = "ORDER.CUSTOMER.NOT_FOUND";

    constructor(customerId: string, cause?: Error) {
        super(`${CustomerNotFoundForOrderError.message} customerId: ${customerId}`, cause);
    }
}

export class PriceNotFoundForOrderLineError extends Exception {
    static readonly message = "Could not resolve a price for order line.";
    public readonly code = "ORDER.ORDERLINE.PRICE.NOT_FOUND";

    constructor(itemId: string, cause?: Error) {
        super(`${PriceNotFoundForOrderLineError.message} itemId: ${itemId}`, cause);
    }
}

export class CannotChangeQuantityOfPlacedOrderError extends Exception {
    static readonly message: "Can't edit quantity of placed order";
    public readonly code = "ORDER.QUANTITY.EDIT.FORBIDDEN";

    constructor(cause?: Error, metadata?: Record<any, any>) {
        super(CannotChangeQuantityOfPlacedOrderError.message, cause, metadata);
    }
}
