import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { env } from "../../../config/env.js";

interface JwtPayload {
    sub: string;
    type?: string;
}

/**
 * Global guard that validates JWT access tokens on every request.
 *
 * Reads `Authorization: Bearer <token>` header, verifies the JWT,
 * and sets `req.user = { userId }` for downstream guards and handlers.
 *
 * Routes decorated with @Public() bypass this guard.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<{ headers: Record<string, string>; user?: { userId: string } }>();
        const token = this.extractTokenFromHeader(request.headers);

        if (!token) {
            throw new UnauthorizedException("Missing access token");
        }

        try {
            const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
                secret: env.JWT_SECRET,
            });

            if (payload.type === "refresh") {
                throw new UnauthorizedException("Refresh token cannot be used as access token");
            }

            request.user = { userId: payload.sub };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException("Invalid or expired access token");
        }

        return true;
    }

    private extractTokenFromHeader(headers: Record<string, string>): string | undefined {
        const authorization = headers.authorization;
        if (!authorization) {
            return undefined;
        }

        const [type, token] = authorization.split(" ");
        return type === "Bearer" ? token : undefined;
    }
}
