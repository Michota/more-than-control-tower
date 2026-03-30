/* eslint-disable no-restricted-syntax */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import z from "zod";

// Load .env from CWD first, then fall back to monorepo root
const cwdEnv = resolve(process.cwd(), ".env");
const rootEnv = resolve(process.cwd(), "../../.env");

if (existsSync(cwdEnv)) {
    config({ path: cwdEnv });
} else if (existsSync(rootEnv)) {
    config({ path: rootEnv });
} else {
    config(); // default dotenv behavior
}

const portSchema = z.coerce.number().int().min(1).max(65535).default(3000);

const isTestEnv = process.env.NODE_ENV === "test";

const envSchema = z.object({
    // Database configuration
    DB_HOST: z.string().min(1),
    DB_PORT: portSchema,
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string().min(1),

    // Server configuration
    SERVER_PORT: portSchema,
    CORS_ORIGIN: z.string().optional(),

    // JWT configuration
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: z.string().min(1).default("15m"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default("7d"),

    // Testing-purposes environment variables
    TEST_DB_NAME: isTestEnv ? z.string().optional() : z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(Object.assign({}, process.env));

if (!result.success) {
    console.error("Invalid environment variables:", z.prettifyError(result.error));
    throw new Error("Invalid environment variables");
}

export const env = result.data;
