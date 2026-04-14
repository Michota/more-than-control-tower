import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { usePermissions } from "@/hooks/use-permissions";
import { WarehousePermission, SalesPermission } from "@mtct/shared-types";
import { Monitor, Moon, Sun } from "lucide-react";
import * as m from "@/lib/paraglide/messages";

function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const next =
        theme === "system" ? (systemTheme === "dark" ? "light" : "dark") : theme === "light" ? "dark" : "system";

    return (
        <Button variant="outline" size="icon" onClick={() => setTheme(next)}>
            {theme === "system" ? (
                <Monitor className="size-4" />
            ) : theme === "dark" ? (
                <Moon className="size-4" />
            ) : (
                <Sun className="size-4" />
            )}
        </Button>
    );
}

export function HomePage() {
    const { canPerform } = usePermissions();

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
            <h1 className="text-4xl font-bold">{m.hello()}</h1>
            <p className="text-muted-foreground">More Than Control Tower</p>
            <div className="flex gap-3">
                {canPerform(WarehousePermission.VIEW_GOODS) && <Button>{m.warehouse_view_goods()}</Button>}
                {canPerform(SalesPermission.DRAFT_ORDER) && <Button>{m.sales_draft_order()}</Button>}
                <ThemeToggle />
            </div>
        </div>
    );
}
