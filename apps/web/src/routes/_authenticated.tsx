import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authenticated")({
    beforeLoad: ({ context }) => {
        if (!context.auth.isAuthenticated) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({ to: "/login" });
        }
    },
    component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    );
}
