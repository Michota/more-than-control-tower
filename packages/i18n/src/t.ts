const enumPrefixes = new Map<object, string>();

/** Register an enum for translation. Call once per enum at setup time. */
export function registerEnum(enumObj: object, prefix: string): void {
    enumPrefixes.set(enumObj, prefix);
}

/**
 * Translate a message key or enum value.
 *
 * Usage:
 * - `t("error_order_not_found")` — regular translation key
 * - `t(OrderStatus, order.status)` — enum value with enum object for prefix resolution
 *
 * Falls back to the key itself (or provided fallback) if no translation is found.
 * The actual message lookup is injected via `setMessageSource()` so this module
 * has no build-time dependency on Paraglide's generated output.
 */
export function t(key: string, fallback?: string): string;
export function t(enumObj: object, value: string): string;
export function t(keyOrEnum: string | object, valueOrFallback?: string): string {
    if (typeof keyOrEnum === "string") {
        const fn = messages[keyOrEnum];
        return fn ? fn() : (valueOrFallback ?? keyOrEnum);
    }
    const prefix = enumPrefixes.get(keyOrEnum);
    if (!prefix) {
        return valueOrFallback ?? String(keyOrEnum);
    }
    const messageKey = `${prefix}_${valueOrFallback!.toLowerCase()}`;
    const fn = messages[messageKey];
    return fn ? fn() : (valueOrFallback ?? messageKey);
}

type MessageFn = () => string;
let messages: Record<string, MessageFn> = {};

/**
 * Inject the Paraglide-generated message functions.
 * Call once at app init: `setMessageSource(await import("@/lib/paraglide/messages"))`.
 */
export function setMessageSource(source: Record<string, MessageFn>): void {
    messages = source;
}
