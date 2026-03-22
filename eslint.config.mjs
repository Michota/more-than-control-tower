// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginJest from "eslint-plugin-jest";

export default tseslint.config(
    {
        ignores: ["eslint.config.mjs", "src/database/migrations/**"],
    },
    pluginJest.configs["flat/recommended"],
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: "commonjs",
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
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
                        { regex: "\\.spec\\.(ts|js)?$", message: "Production code must not import test files." },
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
                            // Relative: ../other-module/domain/**
                            // Absolute: src/modules/other-module/domain/**
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
            "prettier/prettier": ["warn", {}, { usePrettierrc: true }],
            "@typescript-eslint/no-explicit-any": "off",
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
