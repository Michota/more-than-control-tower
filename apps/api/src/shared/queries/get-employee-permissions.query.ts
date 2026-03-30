/**
 * Cross-module read contract: any module needing to check a user's
 * effective permissions sends this query. HR module registers the handler
 * and resolves permissions from positions + per-user overrides.
 *
 * Used by AuthorizationPort adapters (ADR-015) to implement canPerform().
 */
export class GetEmployeePermissionsQuery {
    constructor(public readonly userId: string) {}
}

export interface GetEmployeePermissionsResponse {
    userId: string;
    effectivePermissions: string[];
    positionKeys: string[];
}
