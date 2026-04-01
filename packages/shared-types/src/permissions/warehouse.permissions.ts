import { defineModulePermissions } from "./define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("warehouse", {
    // Goods
    CREATE_GOOD: { key: "create-good", messageKey: "permission_warehouse_create_good" },
    EDIT_GOOD: { key: "edit-good", messageKey: "permission_warehouse_edit_good" },
    DELETE_GOODS: { key: "delete-goods", messageKey: "permission_warehouse_delete_goods" },
    VIEW_GOODS: { key: "view-goods", messageKey: "permission_warehouse_view_goods" },

    // Warehouses
    CREATE_WAREHOUSE: { key: "create-warehouse", messageKey: "permission_warehouse_create_warehouse" },
    EDIT_WAREHOUSE: { key: "edit-warehouse", messageKey: "permission_warehouse_edit_warehouse" },
    CHANGE_WAREHOUSE_STATUS: {
        key: "change-warehouse-status",
        messageKey: "permission_warehouse_change_warehouse_status",
    },
    VIEW_WAREHOUSES: { key: "view-warehouses", messageKey: "permission_warehouse_view_warehouses" },

    // Sectors
    CREATE_SECTOR: { key: "create-sector", messageKey: "permission_warehouse_create_sector" },
    EDIT_SECTOR: { key: "edit-sector", messageKey: "permission_warehouse_edit_sector" },
    CHANGE_SECTOR_STATUS: { key: "change-sector-status", messageKey: "permission_warehouse_change_sector_status" },
    MOVE_STOCK_TO_SECTOR: { key: "move-stock-to-sector", messageKey: "permission_warehouse_move_stock_to_sector" },
    VIEW_SECTORS: { key: "view-sectors", messageKey: "permission_warehouse_view_sectors" },

    // Goods Receipts
    OPEN_GOODS_RECEIPT: { key: "open-goods-receipt", messageKey: "permission_warehouse_open_goods_receipt" },
    SET_GOODS_RECEIPT_LINES: {
        key: "set-goods-receipt-lines",
        messageKey: "permission_warehouse_set_goods_receipt_lines",
    },
    CONFIRM_GOODS_RECEIPT: { key: "confirm-goods-receipt", messageKey: "permission_warehouse_confirm_goods_receipt" },
    DELETE_GOODS_RECEIPT: { key: "delete-goods-receipt", messageKey: "permission_warehouse_delete_goods_receipt" },
    VIEW_GOODS_RECEIPTS: { key: "view-goods-receipts", messageKey: "permission_warehouse_view_goods_receipts" },

    // Codes
    ATTACH_CODE: { key: "attach-code", messageKey: "permission_warehouse_attach_code" },
    DETACH_CODE: { key: "detach-code", messageKey: "permission_warehouse_detach_code" },
    VIEW_CODES: { key: "view-codes", messageKey: "permission_warehouse_view_codes" },

    // Transfer Requests
    VIEW_TRANSFER_REQUESTS: {
        key: "view-transfer-requests",
        messageKey: "permission_warehouse_view_transfer_requests",
    },
    FULFILL_TRANSFER_REQUEST: {
        key: "fulfill-transfer-request",
        messageKey: "permission_warehouse_fulfill_transfer_request",
    },
    CANCEL_TRANSFER_REQUEST: {
        key: "cancel-transfer-request",
        messageKey: "permission_warehouse_cancel_transfer_request",
    },
    REJECT_TRANSFER_REQUEST: {
        key: "reject-transfer-request",
        messageKey: "permission_warehouse_reject_transfer_request",
    },

    // Stock
    TRANSFER_STOCK: { key: "transfer-stock", messageKey: "permission_warehouse_transfer_stock" },
    REMOVE_STOCK: { key: "remove-stock", messageKey: "permission_warehouse_remove_stock" },
    VIEW_STOCK: { key: "view-stock", messageKey: "permission_warehouse_view_stock" },
});

export const WarehousePermission = Keys;
export type WarehousePermission = (typeof WarehousePermission)[keyof typeof WarehousePermission];
export const warehousePermissionDefinitions = definitions;
