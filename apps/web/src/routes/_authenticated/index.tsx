import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import * as m from "@/lib/paraglide/messages";

export const Route = createFileRoute("/_authenticated/")({
    component: HomePage,
});

function ThemeToggle() {
    const { resolvedTheme, setTheme, theme } = useTheme();

    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";

    return (
        <Button variant="outline" size="icon" onClick={() => setTheme(next)}>
            {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
    );
}

function HomePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <h1 className="text-4xl font-bold">{m.hello()}</h1>
            <p className="text-muted-foreground">More Than Control Tower</p>
            <div className="flex gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <ThemeToggle />
            </div>
        </div>
    );
}
