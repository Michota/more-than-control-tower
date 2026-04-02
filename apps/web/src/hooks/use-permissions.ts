import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@mtct/shared-types";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

export function usePermissions() {
    const { isAuthenticated } = useAuth();

    const { data } = useQuery({
        queryKey: ["auth", "permissions"],
        queryFn: () => api.get("auth/permissions", { credentials: "include" }).json<{ permissions: string[] }>(),
        enabled: isAuthenticated,
    });

    const permissions = (data?.permissions ?? []) as Permission[];
    const canPerform = useCallback((p: Permission) => permissions.includes(p), [permissions]);

    return { permissions, canPerform };
}
