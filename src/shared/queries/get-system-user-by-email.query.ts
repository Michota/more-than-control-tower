import type { GetSystemUserResponse } from "./get-system-user.query.js";

/**
 * Cross-module read contract: any module needing to look up a system user by email sends this query.
 * System module registers the handler. Callers have no dependency on System internals.
 */
export class GetSystemUserByEmailQuery {
    constructor(public readonly email: string) {}
}

export type GetSystemUserByEmailResponse = GetSystemUserResponse | null;
