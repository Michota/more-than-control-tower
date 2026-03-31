import { useSyncExternalStore } from "react";
import { setLocale } from "@/lib/paraglide/runtime";
import { getSnapshot, subscribe } from "@/lib/locale-store";

export function useLocale() {
    const locale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    return { locale, setLocale } as const;
}
