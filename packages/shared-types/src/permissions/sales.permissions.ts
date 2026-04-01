import { defineModulePermissions } from "./define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("sales", {
    DRAFT_ORDER: { key: "draft-order", messageKey: "permission_sales_draft_order" },
    EDIT_DRAFT: { key: "edit-draft", messageKey: "permission_sales_edit_draft" },
    PLACE_ORDER: { key: "place-order", messageKey: "permission_sales_place_order" },
    CANCEL_ORDER: { key: "cancel-order", messageKey: "permission_sales_cancel_order" },
    COMPLETE_ORDER: { key: "complete-order", messageKey: "permission_sales_complete_order" },
    ASSIGN_GOOD: { key: "assign-good", messageKey: "permission_sales_assign_good" },
    ASSIGN_STOCK_ENTRY: { key: "assign-stock-entry", messageKey: "permission_sales_assign_stock_entry" },
    VIEW_ORDERS: { key: "view-orders", messageKey: "permission_sales_view_orders" },
});

export const SalesPermission = Keys;
export type SalesPermission = (typeof SalesPermission)[keyof typeof SalesPermission];
export const salesPermissionDefinitions = definitions;
