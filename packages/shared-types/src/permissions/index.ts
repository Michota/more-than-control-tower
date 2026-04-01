export { defineModulePermissions, type PermissionInput } from "./define-module-permissions.js";

export { WarehousePermission, warehousePermissionDefinitions } from "./warehouse.permissions.js";
export { SalesPermission, salesPermissionDefinitions } from "./sales.permissions.js";
export { FreightPermission, freightPermissionDefinitions } from "./freight.permissions.js";
export { ErpPermission, erpPermissionDefinitions } from "./erp.permissions.js";
export { HrPermission, hrPermissionDefinitions } from "./hr.permissions.js";

import type { WarehousePermission } from "./warehouse.permissions.js";
import type { SalesPermission } from "./sales.permissions.js";
import type { FreightPermission } from "./freight.permissions.js";
import type { ErpPermission } from "./erp.permissions.js";
import type { HrPermission } from "./hr.permissions.js";

export type Permission = WarehousePermission | SalesPermission | FreightPermission | ErpPermission | HrPermission;
