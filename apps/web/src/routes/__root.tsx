import { createRootRouteWithContext, Outlet, redirect } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { RouterContext } from "@/router";

export const Route = createRootRouteWithContext<RouterContext>()({
    beforeLoad: ({ context, location }) => {
        if (context.auth.isLoading) {
            return;
        }

        const isLoginPage = location.pathname === "/login";

        if (!context.auth.isAuthenticated && !isLoginPage) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({ to: "/login" });
        }

        if (context.auth.isAuthenticated && isLoginPage) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({ to: "/" });
        }
    },
    component: () => (
        <>
            <Outlet />
            <ReactQueryDevtools />
            <TanStackRouterDevtools />
        </>
    ),
});
