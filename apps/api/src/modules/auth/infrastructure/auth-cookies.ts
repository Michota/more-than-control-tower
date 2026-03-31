import type { Response } from "express";
import { NodeEnv } from "@mtct/shared-types";
import { env } from "../../../config/env.js";

const IS_PRODUCTION = env.NODE_ENV === NodeEnv.Production;

const COOKIE_OPTIONS_BASE = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict" as const,
    path: "/",
};

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

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }): void {
    res.cookie("accessToken", tokens.accessToken, {
        ...COOKIE_OPTIONS_BASE,
        maxAge: durationToMs(env.JWT_EXPIRES_IN),
    });

    res.cookie("refreshToken", tokens.refreshToken, {
        ...COOKIE_OPTIONS_BASE,
        maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
    });
}

export function clearAuthCookies(res: Response): void {
    res.clearCookie("accessToken", COOKIE_OPTIONS_BASE);
    res.clearCookie("refreshToken", COOKIE_OPTIONS_BASE);
}

export function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const pair of cookieHeader.split(";")) {
        const eqIndex = pair.indexOf("=");
        if (eqIndex === -1) {
            continue;
        }
        const key = pair.slice(0, eqIndex).trim();
        const value = pair.slice(eqIndex + 1).trim();
        cookies[key] = decodeURIComponent(value);
    }
    return cookies;
}
