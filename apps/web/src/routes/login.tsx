import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/components/login-page";

export const Route = createFileRoute("/login")({
    beforeLoad: ({ context }) => {
        if (context.auth.isAuthenticated) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({ to: "/" });
        }
    },
    component: LoginPage,
});
