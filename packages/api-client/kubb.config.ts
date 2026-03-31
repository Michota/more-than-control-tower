/**
 * Kubb codegen config — generates typed API client from OpenAPI spec.
 *
 * Usage:
 *   1. pnpm export:openapi       (curl /api-json → openapi.json)
 *   2. pnpm generate             (kubb generate → src/gen/)
 *
 * All plugins write into subdirectories of src/gen/ (gitignored).
 * The custom Ky client adapter lives at src/client.ts — generated code
 * imports it via the relative importPath "../../client".
 */
import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginClient } from "@kubb/plugin-client";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginZod } from "@kubb/plugin-zod";

export default defineConfig({
    root: ".",
    input: { path: "./openapi.json" },
    output: {
        path: "./src/gen",
        clean: true,
        // Strip .ts from generated imports — consumers use bundler resolution
        extension: { ".ts": "" },
    },
    plugins: [
        pluginOas({ validate: false }),
        pluginTs({ output: { path: "models" } }),
        pluginClient({ output: { path: "clients" }, importPath: "../../client" }),
        pluginReactQuery({ output: { path: "hooks" }, client: { importPath: "../../client" } }),
        pluginZod({ output: { path: "zod" } }),
    ],
});
