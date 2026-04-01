import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionAuthApi, sessionAuthQueryKey } from "@mtct/api-client/hooks/useSessionAuth";
import { useLoginAuthApi } from "@mtct/api-client/hooks/useLoginAuth";
import { useLogoutAuthApi } from "@mtct/api-client/hooks/useLogoutAuth";

interface AuthContextValue {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useSessionAuthApi({
        query: { retry: false },
    });

    const isAuthenticated = !isError && !!data;

    const loginMutation = useLoginAuthApi({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: sessionAuthQueryKey() });
            },
        },
    });

    const logoutMutation = useLogoutAuthApi({
        mutation: {
            onSettled: () => {
                void queryClient.invalidateQueries({ queryKey: sessionAuthQueryKey() });
            },
        },
    });

    const login = useCallback(
        async (email: string, password: string) => {
            await loginMutation.mutateAsync({ data: { email, password } });
        },
        [loginMutation],
    );

    const logout = useCallback(async () => {
        await logoutMutation.mutateAsync().catch(() => {});
    }, [logoutMutation]);

    return <AuthContext value={{ isAuthenticated, isLoading, login, logout }}>{children}</AuthContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}
