import { useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionAuthApi, sessionAuthQueryKey } from "@mtct/api-client/hooks/useSessionAuth";
import { useLoginAuthApi } from "@mtct/api-client/hooks/useLoginAuth";
import { useLogoutAuthApi } from "@mtct/api-client/hooks/useLogoutAuth";
import { AuthContext } from "@/lib/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { isSuccess, isLoading } = useSessionAuthApi({
        query: { retry: false },
    });

    const isAuthenticated = isSuccess;

    const loginMutation = useLoginAuthApi({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: sessionAuthQueryKey() });
            },
        },
    });

    const logoutMutation = useLogoutAuthApi();

    const login = useCallback(
        async (email: string, password: string) => {
            await loginMutation.mutateAsync({ data: { email, password } });
        },
        [loginMutation],
    );

    const logout = useCallback(async () => {
        await logoutMutation.mutateAsync().catch(() => {});
        queryClient.removeQueries({ queryKey: sessionAuthQueryKey() });
    }, [logoutMutation, queryClient]);

    return <AuthContext value={{ isAuthenticated, isLoading, login, logout }}>{children}</AuthContext>;
}
