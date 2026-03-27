import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Marks a route as public — bypasses the global JwtAuthGuard.
 *
 * Usage:
 * ```typescript
 * @Public()
 * @Post("login")
 * async login(...) { ... }
 * ```
 */
export function Public() {
    return SetMetadata(IS_PUBLIC_KEY, true);
}
