/* eslint-disable no-restricted-syntax */
import "dotenv/config"; // <-- Must be before any module that reads process.env
import z from "zod";

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
