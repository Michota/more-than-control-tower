// @ts-check
import { noRawTextInJsx } from "./rules/no-raw-text-in-jsx.mjs";

/** @type {import("eslint").ESLint.Plugin} */
const i18nPlugin = {
    rules: {
        "no-raw-text-in-jsx": noRawTextInJsx,
    },
};

/** @type {import("typescript-eslint").ConfigArray} */
export const i18nConfig = [
    {
        files: ["**/*.tsx"],
        plugins: {
            "@mtct/i18n": i18nPlugin,
        },
        rules: {
            "@mtct/i18n/no-raw-text-in-jsx": "warn",
        },
    },
];
