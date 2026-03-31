import "./app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient } from "./lib/query-client";
import { router } from "./router";
import { AuthProvider, useAuth } from "@/lib/auth";

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
    const auth = useAuth();
    return <RouterProvider router={router} context={{ queryClient, auth }} />;
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <InnerApp />
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
