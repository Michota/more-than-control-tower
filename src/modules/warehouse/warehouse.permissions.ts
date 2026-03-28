/**
 * All permission keys for the Warehouse module.
 *
 * Values are the full keys (with module prefix) as stored in the PermissionRegistry.
 * Used with @RequirePermission decorator for compile-time safety.
 *
 * The bare keys (without prefix) are registered via
 * permissionRegistry.registerForModule("warehouse", [...]) in WarehouseModule.onModuleInit().
 */
export const WarehousePermission = {
    // Goods
    CREATE_GOOD: "warehouse:create-good",
    EDIT_GOOD: "warehouse:edit-good",
    DELETE_GOODS: "warehouse:delete-goods",
    VIEW_GOODS: "warehouse:view-goods",

    // Warehouses
    CREATE_WAREHOUSE: "warehouse:create-warehouse",
    EDIT_WAREHOUSE: "warehouse:edit-warehouse",
    CHANGE_WAREHOUSE_STATUS: "warehouse:change-warehouse-status",
    VIEW_WAREHOUSES: "warehouse:view-warehouses",

    // Sectors
    CREATE_SECTOR: "warehouse:create-sector",
    EDIT_SECTOR: "warehouse:edit-sector",
    CHANGE_SECTOR_STATUS: "warehouse:change-sector-status",
    MOVE_STOCK_TO_SECTOR: "warehouse:move-stock-to-sector",
    VIEW_SECTORS: "warehouse:view-sectors",

    // Goods Receipts
    OPEN_GOODS_RECEIPT: "warehouse:open-goods-receipt",
    SET_GOODS_RECEIPT_LINES: "warehouse:set-goods-receipt-lines",
    CONFIRM_GOODS_RECEIPT: "warehouse:confirm-goods-receipt",
    DELETE_GOODS_RECEIPT: "warehouse:delete-goods-receipt",
    VIEW_GOODS_RECEIPTS: "warehouse:view-goods-receipts",

    // Codes
    ATTACH_CODE: "warehouse:attach-code",
    DETACH_CODE: "warehouse:detach-code",
    VIEW_CODES: "warehouse:view-codes",

    // Transfer Requests
    VIEW_TRANSFER_REQUESTS: "warehouse:view-transfer-requests",
    FULFILL_TRANSFER_REQUEST: "warehouse:fulfill-transfer-request",
    CANCEL_TRANSFER_REQUEST: "warehouse:cancel-transfer-request",
    REJECT_TRANSFER_REQUEST: "warehouse:reject-transfer-request",

    // Stock
    TRANSFER_STOCK: "warehouse:transfer-stock",
    REMOVE_STOCK: "warehouse:remove-stock",
    VIEW_STOCK: "warehouse:view-stock",
} as const;

export type WarehousePermission = (typeof WarehousePermission)[keyof typeof WarehousePermission];
