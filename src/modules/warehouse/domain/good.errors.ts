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

export class SectorNotFoundError extends Exception {
    public readonly code = "SECTOR.NOT_FOUND";

    constructor(id: string) {
        super(`Sector with id ${id} not found`);
    }
}

export class SectorNotInWarehouseError extends Exception {
    public readonly code = "SECTOR.NOT_IN_WAREHOUSE";

    constructor(sectorId: string, warehouseId: string) {
        super(`Sector ${sectorId} does not belong to warehouse ${warehouseId}`);
    }
}

export class WarehouseHasStockError extends Exception {
    public readonly code = "WAREHOUSE.HAS_STOCK";

    constructor(id: string) {
        super(`Cannot deactivate warehouse ${id} because it still contains stock`);
    }
}

export class WarehouseNotFoundError extends Exception {
    public readonly code = "WAREHOUSE.NOT_FOUND";

    constructor(id: string) {
        super(`Warehouse with id ${id} not found`);
    }
}

export class GoodHasActiveStockError extends Exception {
    public readonly code = "GOOD.HAS_ACTIVE_STOCK";

    constructor(id: string) {
        super(`Cannot delete good ${id} because it has active stock entries (quantity > 0)`);
    }
}

export class StockEntryNotEmptyError extends Exception {
    public readonly code = "STOCK_ENTRY.NOT_EMPTY";

    constructor(id: string, quantity: number) {
        super(`Cannot delete stock entry ${id} because it still has quantity ${quantity}`);
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
