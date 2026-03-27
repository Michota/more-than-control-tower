import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { env } from "../../../config/env.js";

interface TokenPayload {
    sub: string;
    type?: string;
    purpose?: string;
}

@Injectable()
export class JwtTokenService {
    constructor(private readonly jwtService: JwtService) {}

    signAccessToken(userId: string): string {
        const payload: TokenPayload = { sub: userId };
        return this.jwtService.sign(payload, {
            secret: env.JWT_SECRET,
            expiresIn: env.JWT_EXPIRES_IN,
        } as JwtSignOptions);
    }

    signRefreshToken(userId: string): string {
        const payload: TokenPayload = { sub: userId, type: "refresh" };
        return this.jwtService.sign(payload, {
            secret: env.JWT_REFRESH_SECRET,
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        } as JwtSignOptions);
    }

    signActivationToken(userId: string): string {
        const payload: TokenPayload = { sub: userId, purpose: "activation" };
        return this.jwtService.sign(payload, {
            secret: env.JWT_SECRET,
            expiresIn: "48h",
        } as JwtSignOptions);
    }

    verifyRefreshToken(token: string): { sub: string } {
        const payload = this.jwtService.verify<TokenPayload>(token, {
            secret: env.JWT_REFRESH_SECRET,
        });

        if (payload.type !== "refresh") {
            throw new Error("Not a refresh token");
        }

        return { sub: payload.sub };
    }

    verifyActivationToken(token: string): { sub: string } {
        const payload = this.jwtService.verify<TokenPayload>(token, {
            secret: env.JWT_SECRET,
        });

        if (payload.purpose !== "activation") {
            throw new Error("Not an activation token");
        }

        return { sub: payload.sub };
    }
}
