import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@mtct/shared-types";
import { api } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

export function usePermissions() {
    const { isAuthenticated } = useAuth();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["auth", "permissions"],
        queryFn: () => api.get("auth/permissions", { credentials: "include" }).json<{ permissions: string[] }>(),
        enabled: isAuthenticated,
    });

    const permissions = useMemo(() => (data?.permissions ?? []) as Permission[], [data?.permissions]);
    const canPerform = useCallback((p: Permission) => permissions.includes(p), [permissions]);

    return { permissions, canPerform, isLoading, isError };
}
