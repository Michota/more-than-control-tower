import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { env } from "../../../config/env.js";

const JWT_ISSUER = "dsc-platform";
const JWT_AUDIENCE = "dsc-api";

interface TokenPayload {
    sub: string;
    type?: string;
    purpose?: string;
    iss?: string;
    aud?: string;
}

@Injectable()
export class JwtTokenService {
    constructor(private readonly jwtService: JwtService) {}

    signAccessToken(userId: string): string {
        const payload: TokenPayload = { sub: userId };
        return this.jwtService.sign(payload, {
            secret: env.JWT_SECRET,
            expiresIn: env.JWT_EXPIRES_IN,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        } as JwtSignOptions);
    }

    signRefreshToken(userId: string): string {
        const payload: TokenPayload = { sub: userId, type: "refresh" };
        return this.jwtService.sign(payload, {
            secret: env.JWT_REFRESH_SECRET,
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        } as JwtSignOptions);
    }

    signActivationToken(userId: string): string {
        const payload: TokenPayload = { sub: userId, purpose: "activation" };
        return this.jwtService.sign(payload, {
            secret: env.JWT_SECRET,
            expiresIn: "48h",
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        } as JwtSignOptions);
    }

    verifyRefreshToken(token: string): { sub: string } {
        const payload = this.jwtService.verify<TokenPayload>(token, {
            secret: env.JWT_REFRESH_SECRET,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        if (payload.type !== "refresh") {
            throw new Error("Not a refresh token");
        }

        return { sub: payload.sub };
    }

    verifyActivationToken(token: string): { sub: string } {
        const payload = this.jwtService.verify<TokenPayload>(token, {
            secret: env.JWT_SECRET,
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        if (payload.purpose !== "activation") {
            throw new Error("Not an activation token");
        }

        return { sub: payload.sub };
    }
}
