/**
 * Cross-module read contract: any module needing employee data sends this query.
 * HR module registers the handler. Callers have no dependency on HR internals.
 */
export class GetEmployeeQuery {
    constructor(public readonly employeeId: string) {}
}

export interface GetEmployeePositionAssignmentResponse {
    positionKey: string;
    assignedAt: string;
}

export interface GetEmployeeResponse {
    id: string;
    userId?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    status: string;
    positionAssignments: GetEmployeePositionAssignmentResponse[];
}
