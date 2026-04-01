import { defineModulePermissions } from "../../shared/infrastructure/define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("sales", {
    DRAFT_ORDER: { key: "draft-order", name: "Draft Order" },
    EDIT_DRAFT: { key: "edit-draft", name: "Edit Draft Order" },
    PLACE_ORDER: { key: "place-order", name: "Place Order" },
    CANCEL_ORDER: { key: "cancel-order", name: "Cancel Order" },
    COMPLETE_ORDER: { key: "complete-order", name: "Complete Order" },
    ASSIGN_GOOD: { key: "assign-good", name: "Assign Good to Order" },
    ASSIGN_STOCK_ENTRY: { key: "assign-stock-entry", name: "Assign Stock Entry to Order" },
    VIEW_ORDERS: { key: "view-orders", name: "View Orders" },
});

export const SalesPermission = Keys;
export type SalesPermission = (typeof SalesPermission)[keyof typeof SalesPermission];
export const salesPermissionDefinitions = definitions;
