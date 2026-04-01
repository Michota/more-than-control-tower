// Re-export all permission keys + definitions from shared-types
export {
    type Permission,
    type PermissionInput,
    defineModulePermissions,
    WarehousePermission,
    warehousePermissionDefinitions,
    SalesPermission,
    salesPermissionDefinitions,
    FreightPermission,
    freightPermissionDefinitions,
    ErpPermission,
    erpPermissionDefinitions,
    HrPermission,
    hrPermissionDefinitions,
} from "@mtct/shared-types";

// Backend-only types
export type { PermissionDefinition } from "./permission.types.js";
