import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

// ─── Not Found ───────────────────────────────────────────

export class GoodNotFoundError extends NotFoundDomainException {
    static readonly message = "error_good_not_found";
    public readonly code = "GOOD.NOT_FOUND";

    constructor(id: string) {
        super(GoodNotFoundError.message, undefined, { id });
    }
}

export class ParentGoodNotFoundError extends NotFoundDomainException {
    static readonly message = "error_good_parent_not_found";
    public readonly code = "GOOD.PARENT_NOT_FOUND";

    constructor(id: string) {
        super(ParentGoodNotFoundError.message, undefined, { id });
    }
}

export class GoodsReceiptNotFoundError extends NotFoundDomainException {
    static readonly message = "error_goods_receipt_not_found";
    public readonly code = "GOODS_RECEIPT.NOT_FOUND";

    constructor(id: string) {
        super(GoodsReceiptNotFoundError.message, undefined, { id });
    }
}

export class SectorNotFoundError extends NotFoundDomainException {
    static readonly message = "error_sector_not_found";
    public readonly code = "SECTOR.NOT_FOUND";

    constructor(id: string) {
        super(SectorNotFoundError.message, undefined, { id });
    }
}

export class WarehouseNotFoundError extends NotFoundDomainException {
    static readonly message = "error_warehouse_not_found";
    public readonly code = "WAREHOUSE.NOT_FOUND";

    constructor(id: string) {
        super(WarehouseNotFoundError.message, undefined, { id });
    }
}

export class StockEntryNotFoundError extends NotFoundDomainException {
    static readonly message = "error_stock_entry_not_found";
    public readonly code = "STOCK_ENTRY.NOT_FOUND";

    constructor(goodId: string, warehouseId: string) {
        super(StockEntryNotFoundError.message, undefined, { goodId, warehouseId });
    }
}

// ─── Conflict ────────────────────────────────────────────

export class GoodsReceiptNotDraftError extends ConflictDomainException {
    static readonly message = "error_goods_receipt_not_draft";
    public readonly code = "GOODS_RECEIPT.NOT_DRAFT";

    constructor() {
        super(GoodsReceiptNotDraftError.message);
    }
}

export class GoodsReceiptHasNoLinesError extends ConflictDomainException {
    static readonly message = "error_goods_receipt_no_lines";
    public readonly code = "GOODS_RECEIPT.NO_LINES";

    constructor() {
        super(GoodsReceiptHasNoLinesError.message);
    }
}

export class IncorporatedGoodCannotBeEditedError extends ConflictDomainException {
    static readonly message = "error_good_incorporated_cannot_edit";
    public readonly code = "GOOD.INCORPORATED_CANNOT_EDIT";

    constructor(id: string, parentId: string) {
        super(IncorporatedGoodCannotBeEditedError.message, undefined, { id, parentId });
    }
}

export class SectorNotInWarehouseError extends ConflictDomainException {
    static readonly message = "error_sector_not_in_warehouse";
    public readonly code = "SECTOR.NOT_IN_WAREHOUSE";

    constructor(sectorId: string, warehouseId: string) {
        super(SectorNotInWarehouseError.message, undefined, { sectorId, warehouseId });
    }
}

export class WarehouseHasStockError extends ConflictDomainException {
    static readonly message = "error_warehouse_has_stock";
    public readonly code = "WAREHOUSE.HAS_STOCK";

    constructor(id: string) {
        super(WarehouseHasStockError.message, undefined, { id });
    }
}

export class GoodHasActiveStockError extends ConflictDomainException {
    static readonly message = "error_good_has_active_stock";
    public readonly code = "GOOD.HAS_ACTIVE_STOCK";

    constructor(id: string) {
        super(GoodHasActiveStockError.message, undefined, { id });
    }
}

export class StockEntryNotEmptyError extends ConflictDomainException {
    static readonly message = "error_stock_entry_not_empty";
    public readonly code = "STOCK_ENTRY.NOT_EMPTY";

    constructor(id: string, quantity: number) {
        super(StockEntryNotEmptyError.message, undefined, { id, quantity });
    }
}

export class InsufficientStockError extends ConflictDomainException {
    static readonly message = "error_stock_entry_insufficient";
    public readonly code = "STOCK_ENTRY.INSUFFICIENT";

    constructor(goodId: string, available: number, requested: number) {
        super(InsufficientStockError.message, undefined, { goodId, available, requested });
    }
}

export class StockEntryReservedError extends ConflictDomainException {
    static readonly message = "error_stock_entry_reserved";
    public readonly code = "STOCK_ENTRY.RESERVED";

    constructor(stockEntryId: string, reason?: string) {
        super(StockEntryReservedError.message, undefined, { stockEntryId, reason });
    }
}
