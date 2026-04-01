import { z } from "zod";
import { getLocale } from "@/lib/paraglide/runtime";

/**
 * Syncs Zod's error locale with the current Paraglide locale.
 * Call this at app startup and whenever locale changes.
 */
export function syncZodLocale(): void {
    const locale = getLocale();
    const localeFactory = z.locales[locale as keyof typeof z.locales];
    if (localeFactory) {
        z.config(localeFactory());
    }
}
