/**
 * Cross-module read contract: any module needing to check if an employee
 * is available on a specific date sends this query.
 *
 * HR module registers the handler and checks against leave schedules,
 * shift assignments, etc.
 *
 * Example: Freight asks "is driver X available on 2026-04-01?"
 */
export class CheckEmployeeAvailabilityQuery {
    constructor(
        public readonly employeeId: string,
        public readonly date: string,
    ) {}
}

export interface CheckEmployeeAvailabilityResponse {
    employeeId: string;
    date: string;
    available: boolean;
    reason?: string;
}
