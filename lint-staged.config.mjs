const isLintable = (f) => !f.endsWith("eslint.config.mjs");

export default {
    "*.{ts,tsx,js,mjs}": (filenames) => {
        const commands = [];

        const apiFiles = filenames.filter((f) => f.includes("apps/api/") && isLintable(f));
        if (apiFiles.length > 0) {
            commands.push(`eslint --fix --config apps/api/eslint.config.mjs ${apiFiles.join(" ")}`);
        }

        commands.push(`prettier --write --no-error-on-unmatched-pattern ${filenames.join(" ")}`);
        return commands;
    },
    "*.json": ["prettier --write --no-error-on-unmatched-pattern"],
};
