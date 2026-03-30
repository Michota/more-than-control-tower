// @ts-check
import { baseConfig } from "../../packages/eslint-config/base.mjs";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist", "src/routeTree.gen.ts"],
    },
    ...baseConfig,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
