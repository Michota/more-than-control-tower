// @ts-check
import { baseConfig } from "../../packages/eslint-config/base.mjs";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";
import reactHooks from "eslint-plugin-react-hooks";
import { default as reactRefresh } from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist", "src/routeTree.gen.ts", "src/lib/paraglide"],
    },
    ...baseConfig,
    ...pluginQuery.configs["flat/recommended"],
    ...pluginRouter.configs["flat/recommended"],
    {
        plugins: { "react-hooks": reactHooks },
        rules: reactHooks.configs["recommended-latest"].rules,
    },
    reactRefresh.configs.vite,
    {
        files: ["**/routes/**/*.tsx", "**/components/ui/**/*.tsx", "**/lib/**/*.tsx"],
        rules: {
            "react-refresh/only-export-components": "off",
        },
    },
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
