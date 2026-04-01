import type { PermissionInput } from "@mtct/shared-types";

export interface PermissionDefinition extends PermissionInput {
    /** Full key with module prefix (e.g., "warehouse:create-receipt") — set by the registry */
    fullKey: string;
    /** Module that registered this permission */
    module: string;
}
