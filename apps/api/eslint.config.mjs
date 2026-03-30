// @ts-check
import { nestjsConfig } from "../../packages/eslint-config/nestjs.mjs";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["eslint.config.mjs", "src/database/migrations/**"],
    },
    ...nestjsConfig,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
