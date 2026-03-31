import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { QueryBus } from "@nestjs/cqrs";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { env } from "../../../config/env.js";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../queries/get-system-user.query.js";
import { parseCookies } from "../../../modules/auth/infrastructure/auth-cookies.js";

interface JwtPayload {
    sub: string;
    type?: string;
    purpose?: string;
    aud?: string;
    iss?: string;
}

/**
 * Global guard that validates JWT access tokens on every request.
 *
 * Reads token from `Authorization: Bearer <token>` header or `accessToken` cookie,
 * verifies the JWT, and sets `req.user = { userId }` for downstream guards and handlers.
 *
 * Rejects refresh tokens, activation tokens, and suspended/unactivated users.
 * Routes decorated with @Public() bypass this guard.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly queryBus: QueryBus,
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
        const token = this.extractToken(request.headers);

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

            if (payload.purpose === "activation") {
                throw new UnauthorizedException("Activation token cannot be used as access token");
            }

            const systemUser = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
                new GetSystemUserQuery(payload.sub),
            );

            if (!systemUser || systemUser.status !== "activated") {
                throw new UnauthorizedException("User account is not active");
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

    private extractToken(headers: Record<string, string>): string | undefined {
        const fromHeader = this.extractTokenFromHeader(headers);
        if (fromHeader) {
            return fromHeader;
        }
        return this.extractTokenFromCookie(headers);
    }

    private extractTokenFromHeader(headers: Record<string, string>): string | undefined {
        const authorization = headers.authorization;
        if (!authorization) {
            return undefined;
        }

        const [type, token] = authorization.split(" ");
        return type === "Bearer" ? token : undefined;
    }

    private extractTokenFromCookie(headers: Record<string, string>): string | undefined {
        const cookieHeader = headers.cookie;
        if (!cookieHeader) {
            return undefined;
        }
        const cookies = parseCookies(cookieHeader);
        return cookies.accessToken || undefined;
    }
}
