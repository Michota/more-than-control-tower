import type { Response } from "express";
import { NodeEnv } from "@mtct/shared-types";
import type { ApiEnv } from "../../../config/env.js";

/** Parse duration strings like "15m", "7d", "1h" to milliseconds. */
function durationToMs(duration: string): number {
    const match = duration.match(/^(\d+)\s*(s|m|h|d)$/);
    if (!match) {
        throw new Error(`Invalid duration format: ${duration}`);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return value * multipliers[unit];
}

let _env: ApiEnv | undefined;
async function getEnv(): Promise<ApiEnv> {
    if (!_env) {
        _env = (await import("../../../config/env.js")).env;
    }
    return _env;
}

function cookieOptionsBase(env: ApiEnv) {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === NodeEnv.Production,
        sameSite: "strict" as const,
        path: "/",
    };
}

export async function setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
): Promise<void> {
    const env = await getEnv();
    const base = cookieOptionsBase(env);

    res.cookie("accessToken", tokens.accessToken, {
        ...base,
        maxAge: durationToMs(env.JWT_EXPIRES_IN),
    });

    res.cookie("refreshToken", tokens.refreshToken, {
        ...base,
        maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
    });
}

export async function clearAuthCookies(res: Response): Promise<void> {
    const env = await getEnv();
    res.clearCookie("accessToken", cookieOptionsBase(env));
    res.clearCookie("refreshToken", cookieOptionsBase(env));
}
