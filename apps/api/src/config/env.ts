/* eslint-disable no-restricted-syntax */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import z from "zod";
import { envSchema, type Env } from "@mtct/shared-types";

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

const isTestEnv = process.env.NODE_ENV === "test";

const apiEnvSchema = envSchema.extend({
    // Testing-purposes environment variables
    TEST_DB_NAME: isTestEnv ? z.string().min(1) : z.string().optional(),
});

export type { Env };
export type ApiEnv = z.infer<typeof apiEnvSchema>;

const result = apiEnvSchema.safeParse(Object.assign({}, process.env));

if (!result.success) {
    console.error("Invalid environment variables:", z.prettifyError(result.error));
    throw new Error("Invalid environment variables");
}

export const env = result.data;
