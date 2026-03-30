/**
 * All permission keys for the Sales module.
 *
 * Values are the full keys (with module prefix) as stored in the PermissionRegistry.
 * Used with @RequirePermission decorator for compile-time safety.
 */
export const SalesPermission = {
    DRAFT_ORDER: "sales:draft-order",
    EDIT_DRAFT: "sales:edit-draft",
    PLACE_ORDER: "sales:place-order",
    CANCEL_ORDER: "sales:cancel-order",
    COMPLETE_ORDER: "sales:complete-order",
    ASSIGN_GOOD: "sales:assign-good",
    ASSIGN_STOCK_ENTRY: "sales:assign-stock-entry",
    VIEW_ORDERS: "sales:view-orders",
} as const;

export type SalesPermission = (typeof SalesPermission)[keyof typeof SalesPermission];
