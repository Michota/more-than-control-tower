import { defineModulePermissions } from "./define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("warehouse", {
    // Goods
    CREATE_GOOD: { key: "create-good", name: "Create Good" },
    EDIT_GOOD: { key: "edit-good", name: "Edit Good" },
    DELETE_GOODS: { key: "delete-goods", name: "Delete Goods" },
    VIEW_GOODS: { key: "view-goods", name: "View Goods" },

    // Warehouses
    CREATE_WAREHOUSE: { key: "create-warehouse", name: "Create Warehouse" },
    EDIT_WAREHOUSE: { key: "edit-warehouse", name: "Edit Warehouse" },
    CHANGE_WAREHOUSE_STATUS: { key: "change-warehouse-status", name: "Change Warehouse Status" },
    VIEW_WAREHOUSES: { key: "view-warehouses", name: "View Warehouses" },

    // Sectors
    CREATE_SECTOR: { key: "create-sector", name: "Create Sector" },
    EDIT_SECTOR: { key: "edit-sector", name: "Edit Sector" },
    CHANGE_SECTOR_STATUS: { key: "change-sector-status", name: "Change Sector Status" },
    MOVE_STOCK_TO_SECTOR: { key: "move-stock-to-sector", name: "Move Stock to Sector" },
    VIEW_SECTORS: { key: "view-sectors", name: "View Sectors" },

    // Goods Receipts
    OPEN_GOODS_RECEIPT: { key: "open-goods-receipt", name: "Open Goods Receipt" },
    SET_GOODS_RECEIPT_LINES: { key: "set-goods-receipt-lines", name: "Set Goods Receipt Lines" },
    CONFIRM_GOODS_RECEIPT: { key: "confirm-goods-receipt", name: "Confirm Goods Receipt" },
    DELETE_GOODS_RECEIPT: { key: "delete-goods-receipt", name: "Delete Goods Receipt" },
    VIEW_GOODS_RECEIPTS: { key: "view-goods-receipts", name: "View Goods Receipts" },

    // Codes
    ATTACH_CODE: { key: "attach-code", name: "Attach Code to Good" },
    DETACH_CODE: { key: "detach-code", name: "Detach Code from Good" },
    VIEW_CODES: { key: "view-codes", name: "View Codes" },

    // Transfer Requests
    VIEW_TRANSFER_REQUESTS: { key: "view-transfer-requests", name: "View Transfer Requests" },
    FULFILL_TRANSFER_REQUEST: { key: "fulfill-transfer-request", name: "Fulfill Transfer Request" },
    CANCEL_TRANSFER_REQUEST: { key: "cancel-transfer-request", name: "Cancel Transfer Request" },
    REJECT_TRANSFER_REQUEST: { key: "reject-transfer-request", name: "Reject Transfer Request" },

    // Stock
    TRANSFER_STOCK: { key: "transfer-stock", name: "Transfer Stock" },
    REMOVE_STOCK: { key: "remove-stock", name: "Remove Stock" },
    VIEW_STOCK: { key: "view-stock", name: "View Stock" },
});

export const WarehousePermission = Keys;
export type WarehousePermission = (typeof WarehousePermission)[keyof typeof WarehousePermission];
export const warehousePermissionDefinitions = definitions;
