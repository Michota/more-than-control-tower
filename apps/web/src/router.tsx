import type { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/query-client";

export interface RouterContext {
    queryClient: QueryClient;
    auth: {
        isAuthenticated: boolean;
        isLoading: boolean;
    };
}

export const router = createRouter({
    routeTree,
    context: {
        queryClient,
        auth: undefined!,
    },
});

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
