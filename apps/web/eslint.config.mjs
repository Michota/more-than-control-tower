// @ts-check
import { baseConfig } from "../../packages/eslint-config/base.mjs";
import pluginQuery from "@tanstack/eslint-plugin-query";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist", "src/routeTree.gen.ts", "src/lib/paraglide"],
    },
    ...baseConfig,
    ...pluginQuery.configs["flat/recommended"],
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
