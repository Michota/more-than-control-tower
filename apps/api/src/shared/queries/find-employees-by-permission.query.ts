/**
 * Cross-module read contract: any module can find employees who have
 * a specific effective permission.
 *
 * Example: Freight module asks "give me employees who can drive category C"
 * by sending FindEmployeesByPermissionQuery("freight:drive-cat-c").
 *
 * HR module registers the handler and resolves effective permissions
 * from positions + per-user overrides.
 */
export class FindEmployeesByPermissionQuery {
    constructor(public readonly permissionKey: string) {}
}

export interface FindEmployeesByPermissionEmployeeResponse {
    employeeId: string;
    userId?: string;
    firstName: string;
    lastName: string;
}

export interface FindEmployeesByPermissionResponse {
    employees: FindEmployeesByPermissionEmployeeResponse[];
}
