import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../guards/permission.guard.js";

export const REQUIRED_PERMISSION_KEY = "requiredPermission";

/**
 * Decorator that requires the authenticated user to have a specific permission.
 *
 * Combines JWT authentication check (via JwtAuthGuard, when available) with
 * permission authorization check (via PermissionGuard).
 *
 * Usage:
 * ```typescript
 * @RequirePermission(WarehousePermission.CREATE_GOOD)
 * @Post("goods")
 * async createGood(...) { ... }
 * ```
 *
 * The guard reads `req.user.userId` (set by JwtAuthGuard) and calls
 * `AuthorizationPort.canPerform(userId, permissionKey)`.
 *
 * Note: JwtAuthGuard is not applied here — it will be added globally
 * or by the auth module. This decorator only handles the permission layer.
 */
export function RequirePermission(permissionKey: string) {
    return applyDecorators(SetMetadata(REQUIRED_PERMISSION_KEY, permissionKey), UseGuards(PermissionGuard));
}
