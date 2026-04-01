import { useCallback, useMemo } from "react";
import type { Permission } from "@mtct/shared-types";
import { useGetPermissionsAuthApi } from "@mtct/api-client/hooks/useGetPermissionsAuth";
import { useAuth } from "@/lib/auth";

export function usePermissions() {
    const { isAuthenticated } = useAuth();
    const { data, isLoading, isError } = useGetPermissionsAuthApi({ query: { enabled: isAuthenticated } });

    const permissions = useMemo(() => (data?.permissions ?? []) as Permission[], [data?.permissions]);
    const canPerform = useCallback((p: Permission) => permissions.includes(p), [permissions]);

    return { permissions, canPerform, isLoading, isError };
}
