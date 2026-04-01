import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { usePermissions } from "@/hooks/use-permissions";
import { WarehousePermission, SalesPermission } from "@mtct/shared-types";
import { Moon, Sun } from "lucide-react";
import * as m from "@/lib/paraglide/messages";

function ThemeToggle() {
    const { resolvedTheme, setTheme, theme } = useTheme();

    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";

    return (
        <Button variant="outline" size="icon" onClick={() => setTheme(next)}>
            {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
    );
}

export function HomePage() {
    const { canPerform } = usePermissions();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <h1 className="text-4xl font-bold">{m.hello()}</h1>
            <p className="text-muted-foreground">More Than Control Tower</p>
            <div className="flex gap-3">
                {canPerform(WarehousePermission.VIEW_GOODS) && <Button>View Goods</Button>}
                {canPerform(SalesPermission.DRAFT_ORDER) && <Button>Draft Order</Button>}
                <ThemeToggle />
            </div>
        </div>
    );
}
