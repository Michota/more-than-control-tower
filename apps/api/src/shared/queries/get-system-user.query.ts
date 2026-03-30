/**
 * Cross-module read contract: any module needing system user data sends this query.
 * System module registers the handler. Callers have no dependency on System internals.
 */
export class GetSystemUserQuery {
    constructor(public readonly userId: string) {}
}

export interface GetSystemUserResponse {
    id: string;
    email: string;
    name: string;
    roles: string[];
    status: string;
}
