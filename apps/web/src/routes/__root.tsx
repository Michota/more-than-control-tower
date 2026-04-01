import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { RouterContext } from "@/router";

export const Route = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <TooltipProvider>
            <Outlet />
            <ReactQueryDevtools />
            <TanStackRouterDevtools />
        </TooltipProvider>
    ),
});
