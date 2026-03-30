import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_PERMISSION_KEY } from "../decorators/require-permission.decorator.js";
import { AUTHORIZATION_PORT, type AuthorizationPort } from "../authorization.port.js";

/**
 * Guard that checks whether the authenticated user has the required permission.
 *
 * Reads the permission key from route metadata (set by @RequirePermission decorator)
 * and the userId from `req.user.userId` (set by JwtAuthGuard).
 *
 * If no permission metadata is set, the guard passes (no restriction).
 * If no user is on the request, the guard denies (must be authenticated first).
 */
@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(AUTHORIZATION_PORT)
        private readonly authorizationPort: AuthorizationPort,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermission = this.reflector.getAllAndOverride<string | undefined>(REQUIRED_PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermission) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{ user?: { userId: string } }>();
        const userId = request.user?.userId;

        if (!userId) {
            throw new ForbiddenException("No authenticated user — cannot check permissions");
        }

        const allowed = await this.authorizationPort.canPerform(userId, requiredPermission);
        if (!allowed) {
            throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
        }

        return true;
    }
}
