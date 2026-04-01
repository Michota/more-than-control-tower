import { getLocale, setLocale as paraglideSetLocale, overwriteSetLocale, type Locale } from "@/lib/paraglide/runtime";
import { syncZodLocale } from "@/lib/zod-locale";

const listeners = new Set<() => void>();

function notifyListeners(): void {
    for (const listener of listeners) {
        listener();
    }
}

export function subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

export function getSnapshot(): Locale {
    return getLocale();
}

/**
 * Intercepts Paraglide's setLocale so that any call — direct or via hook —
 * syncs Zod locale, updates <html lang>, and notifies React subscribers.
 */
export function initLocale(): void {
    const originalSetLocale = paraglideSetLocale;

    overwriteSetLocale((newLocale, options) => {
        void Promise.resolve(originalSetLocale(newLocale, options)).then(() => {
            syncZodLocale();
            document.documentElement.lang = newLocale;
            notifyListeners();
        });
    });

    // Sync on startup
    syncZodLocale();
    document.documentElement.lang = getLocale();
}
