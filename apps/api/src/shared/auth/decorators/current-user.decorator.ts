import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
    userId: string;
}

/**
 * Extracts the authenticated user from the request.
 *
 * Set by JwtAuthGuard after verifying the JWT token.
 *
 * Usage:
 * ```typescript
 * @Post()
 * async createGood(@CurrentUser() user: RequestUser) {
 *     console.log(user.userId);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return request.user;
});
