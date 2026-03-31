import { useCallback, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "mtct-theme";

const listeners = new Set<() => void>();

function getStoredTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "system" || stored === "light" || stored === "dark") {
        return stored;
    }
    return "system";
}

function getSystemTheme(): ResolvedTheme {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
    return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: ResolvedTheme) {
    document.documentElement.classList.toggle("dark", resolved === "dark");
}

function notify() {
    for (const listener of listeners) {
        listener();
    }
}

// Apply on load and listen for OS preference changes
applyTheme(resolveTheme(getStoredTheme()));
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredTheme() === "system") {
        applyTheme(getSystemTheme());
    }
    notify();
});

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
    return getStoredTheme();
}

export function useTheme() {
    const theme = useSyncExternalStore(subscribe, getSnapshot);
    const resolvedTheme = resolveTheme(theme);

    const setTheme = useCallback((next: Theme) => {
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(resolveTheme(next));
        notify();
    }, []);

    return { theme, resolvedTheme, setTheme };
}
