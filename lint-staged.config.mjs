export default {
    "*.{ts,tsx,js,mjs}": (filenames) => {
        const commands = [];

        const apiFiles = filenames.filter((f) => f.includes("apps/api/"));
        if (apiFiles.length > 0) {
            commands.push(`eslint --fix --config apps/api/eslint.config.mjs ${apiFiles.join(" ")}`);
        }

        const webFiles = filenames.filter((f) => f.includes("apps/web/"));
        if (webFiles.length > 0) {
            commands.push(`eslint --fix --config apps/web/eslint.config.mjs ${webFiles.join(" ")}`);
        }

        commands.push(`prettier --write --no-error-on-unmatched-pattern ${filenames.join(" ")}`);
        return commands;
    },
    "*.json": ["prettier --write --no-error-on-unmatched-pattern"],
};
