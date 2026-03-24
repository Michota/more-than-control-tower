import { Exception } from "../../../libs/exceptions/exception.abstract.js";

export class GoodNotFoundError extends Exception {
    public readonly code = "GOOD.NOT_FOUND";

    constructor(id: string) {
        super(`Good with id ${id} not found`);
    }
}

export class ParentGoodNotFoundError extends Exception {
    public readonly code = "GOOD.PARENT_NOT_FOUND";

    constructor(id: string) {
        super(`Parent good with id ${id} not found`);
    }
}

export class GoodsReceiptNotFoundError extends Exception {
    public readonly code = "GOODS_RECEIPT.NOT_FOUND";

    constructor(id: string) {
        super(`Goods receipt with id ${id} not found`);
    }
}

export class GoodsReceiptNotDraftError extends Exception {
    public readonly code = "GOODS_RECEIPT.NOT_DRAFT";

    constructor() {
        super("Goods receipt can only be modified while in DRAFT status");
    }
}

export class GoodsReceiptHasNoLinesError extends Exception {
    public readonly code = "GOODS_RECEIPT.NO_LINES";

    constructor() {
        super("Cannot confirm a goods receipt with no lines");
    }
}

export class IncorporatedGoodCannotBeEditedError extends Exception {
    public readonly code = "GOOD.INCORPORATED_CANNOT_EDIT";

    constructor(id: string, parentId: string) {
        super(`Good ${id} is incorporated into ${parentId} and cannot be edited while it has a parent`);
    }
}

export class StockEntryNotFoundError extends Exception {
    public readonly code = "STOCK_ENTRY.NOT_FOUND";

    constructor(goodId: string, warehouseId: string) {
        super(`No stock entry found for good ${goodId} in warehouse ${warehouseId}`);
    }
}

export class InsufficientStockError extends Exception {
    public readonly code = "STOCK_ENTRY.INSUFFICIENT";

    constructor(goodId: string, available: number, requested: number) {
        super(`Insufficient stock for good ${goodId}: requested ${requested}, available ${available}`);
    }
}
