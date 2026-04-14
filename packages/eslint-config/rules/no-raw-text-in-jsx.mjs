/** @type {import("eslint").Rule.RuleModule} */
export const noRawTextInJsx = {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Disallow hardcoded string literals in JSX. Use Paraglide message functions (m.key()) instead.",
        },
        schema: [
            {
                type: "object",
                properties: {
                    allowedAttributes: {
                        type: "array",
                        items: { type: "string" },
                    },
                    ignorePatterns: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            noRawText: 'Hardcoded string "{{text}}" in JSX. Use a Paraglide message function (m.key()) instead.',
            noRawAttribute:
                'Hardcoded string in "{{attr}}" attribute. Use a Paraglide message function (m.key()) instead.',
        },
    },

    create(context) {
        const options = context.options[0] ?? {};

        const SAFE_ATTRIBUTES = new Set([
            // HTML attributes that never contain user-visible text
            "className",
            "class",
            "href",
            "src",
            "id",
            "name",
            "type",
            "htmlFor",
            "role",
            "tabIndex",
            "style",
            "target",
            "rel",
            "method",
            "action",
            "encType",
            "autoComplete",
            "inputMode",
            "pattern",
            "value",
            "defaultValue",
            "accept",
            "crossOrigin",
            "loading",
            "decoding",
            "referrerPolicy",
            "sandbox",
            "sizes",
            "srcSet",
            "media",
            "as",
            "integrity",
            "key",
            // Component API props (non-user-visible)
            "variant",
            "size",
            "align",
            "side",
            "orientation",
            "dir",
            "asChild",
            "color",
            "layout",
            "position",
            "mode",
            "slot",
            ...(options.allowedAttributes ?? []),
        ]);

        const DATA_OR_ON_PATTERN = /^(data-|on[A-Z])/;

        const I18N_ATTRIBUTES = new Set([
            "aria-label",
            "aria-placeholder",
            "aria-roledescription",
            "aria-valuetext",
            "title",
            "alt",
            "placeholder",
            "label",
        ]);

        const ignorePatterns = (options.ignorePatterns ?? []).map((p) => new RegExp(p));

        function isWhitespaceOrTrivial(text) {
            const trimmed = text.trim();
            if (trimmed === "") return true;
            // Single non-letter characters (punctuation, symbols)
            if (/^[^a-zA-Z\u00C0-\u024F\u0400-\u04FF]$/.test(trimmed)) return true;
            // Only numbers
            if (/^\d+([.,]\d+)?$/.test(trimmed)) return true;
            return false;
        }

        function isIgnored(text) {
            return ignorePatterns.some((re) => re.test(text.trim()));
        }

        return {
            JSXText(node) {
                if (isWhitespaceOrTrivial(node.value)) return;
                if (isIgnored(node.value)) return;

                const text = node.value.trim().length > 30 ? node.value.trim().slice(0, 30) + "..." : node.value.trim();

                context.report({
                    node,
                    messageId: "noRawText",
                    data: { text },
                });
            },

            JSXExpressionContainer(node) {
                if (node.expression.type !== "Literal" || typeof node.expression.value !== "string") return;
                if (isWhitespaceOrTrivial(node.expression.value)) return;
                if (isIgnored(node.expression.value)) return;

                // Skip if this is an attribute value
                if (node.parent.type === "JSXAttribute") return;

                const text =
                    node.expression.value.length > 30
                        ? node.expression.value.slice(0, 30) + "..."
                        : node.expression.value;

                context.report({
                    node,
                    messageId: "noRawText",
                    data: { text },
                });
            },

            JSXAttribute(node) {
                const attrName =
                    node.name.type === "JSXNamespacedName"
                        ? `${node.name.namespace.name}:${node.name.name.name}`
                        : node.name.name;

                // Only flag known i18n-sensitive attributes
                if (!I18N_ATTRIBUTES.has(attrName)) return;

                const value = node.value;
                if (!value) return;

                // String literal: <div title="hello" />
                if (value.type === "Literal" && typeof value.value === "string") {
                    if (isWhitespaceOrTrivial(value.value)) return;
                    if (isIgnored(value.value)) return;

                    context.report({
                        node: value,
                        messageId: "noRawAttribute",
                        data: { attr: attrName },
                    });
                    return;
                }

                // Expression: <div title={"hello"} />
                if (
                    value.type === "JSXExpressionContainer" &&
                    value.expression.type === "Literal" &&
                    typeof value.expression.value === "string"
                ) {
                    if (isWhitespaceOrTrivial(value.expression.value)) return;
                    if (isIgnored(value.expression.value)) return;

                    context.report({
                        node: value,
                        messageId: "noRawAttribute",
                        data: { attr: attrName },
                    });
                }
            },
        };
    },
};
