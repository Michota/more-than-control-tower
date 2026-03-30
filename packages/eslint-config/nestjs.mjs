// @ts-check
import globals from "globals";
import pluginVitest from "@vitest/eslint-plugin";
import { baseConfig } from "./base.mjs";
import tseslint from "typescript-eslint";

/** @type {import("typescript-eslint").ConfigArray} */
export const nestjsConfig = tseslint.config(
    ...baseConfig,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: "commonjs",
        },
    },
    {
        ...pluginVitest.configs.recommended,
        rules: {
            ...pluginVitest.configs.recommended.rules,
            "vitest/no-export": "off",
        },
    },
    {
        files: ["**/*.ts", "**/*.js"],
        ignores: ["**/*.spec.ts", "**/*.spec.js"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            regex: "\\.spec\\.(ts|js)?$",
                            message: "Production code must not import test files.",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["**/domain/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            regex: "^(?:\\.\\./)+(?:database|commands|queries)",
                            message:
                                "Domain layer must not import from application or infrastructure layers. Use only /domain, /libs, or /shared.",
                        },
                        {
                            regex: "(?:^(?:\\.\\./)+[^/]+|src/modules/[^/]+)/domain/",
                            message:
                                "Domain layer must not import from another module's domain. To react to another module's domain events, create a handler in the application layer (application/event-handlers/).",
                        },
                    ],
                },
            ],
        },
    },
    {
        rules: {
            "@typescript-eslint/no-floating-promises": "warn",
            "@typescript-eslint/no-unsafe-argument": "warn",
            "no-restricted-syntax": [
                "error",
                {
                    selector: "MemberExpression[object.name='process'][property.name='env']",
                    message: "Use the typed `env` from src/config/env.ts instead of process.env directly.",
                },
            ],
        },
    },
);
