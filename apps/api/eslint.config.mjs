// @ts-check
import { nestjsConfig } from "@mtct/eslint-config/nestjs";
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
