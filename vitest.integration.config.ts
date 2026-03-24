import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            src: path.resolve(__dirname, "src"),
        },
    },
    test: {
        include: ["src/**/*.integration-spec.ts"],
        globals: true,
        testTimeout: 30_000,
        hookTimeout: 30_000,
        pool: "forks",
        singleFork: true,
    },
});
