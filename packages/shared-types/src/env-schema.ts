import z from "zod";
import { NodeEnv } from "./node-env.js";

export const portSchema = z.coerce.number().int().min(1).max(65535).default(3000);

export const envSchema = z.object({
    NODE_ENV: z.enum(NodeEnv).default(NodeEnv.Development),

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
});

export type Env = z.infer<typeof envSchema>;
