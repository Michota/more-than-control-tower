import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
    component: () => (
        <>
            <Outlet />
            <ReactQueryDevtools />
            <TanStackRouterDevtools />
        </>
    ),
});
