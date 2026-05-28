const isLintable = (f) =>
    !f.endsWith("eslint.config.mjs") && !f.includes("vitest.config") && !f.includes("vitest.integration.config");

const eslintTargets = [
    { path: "apps/api/", config: "apps/api/eslint.config.mjs" },
    { path: "apps/web/", config: "apps/web/eslint.config.mjs" },
    // add new workspace packages here as they get their own eslint config
];

export default {
    "*.{ts,tsx,js,mjs}": (filenames) => {
        const commands = [];
        for (const { path, config } of eslintTargets) {
            const files = filenames.filter((f) => f.includes(path) && isLintable(f));
            if (files.length > 0) {
                commands.push(`eslint --fix --config ${config} ${files.join(" ")}`);
            }
        }

        commands.push(`prettier --write --no-error-on-unmatched-pattern ${filenames.join(" ")}`);
        return commands;
    },
    "*.json": ["prettier --write --no-error-on-unmatched-pattern"],
};
