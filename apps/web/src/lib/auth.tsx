import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import ky from "ky";

interface AuthContextValue {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const api = ky.create({ prefixUrl: "/api", credentials: "include" });

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get("auth/session")
            .then(() => setIsAuthenticated(true))
            .catch(() => setIsAuthenticated(false))
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        await api.post("auth/login", { json: { email, password } });
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(async () => {
        await api.post("auth/logout").catch(() => {});
        setIsAuthenticated(false);
    }, []);

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
