/**
 * Cross-module read contract: any module can find employees matching
 * a position and qualification criteria.
 *
 * Example: Freight module asks "give me drivers with license category C"
 * by sending FindEmployeesByQualificationQuery({ positionKey: "freight:driver",
 * qualificationFilters: [{ key: "licenseCategory", operator: "eq", value: "C" }] }).
 *
 * HR module registers the handler. The requesting module knows only
 * the query shape and response interface.
 */
export interface QualificationFilter {
    /** Qualification key to filter on */
    key: string;
    /** "eq" for exact match, "contains" for STRING_ARRAY membership */
    operator: "eq" | "contains";
    /** Value to match against */
    value: string;
}

export class FindEmployeesByQualificationQuery {
    constructor(
        public readonly positionKey: string,
        public readonly qualificationFilters: QualificationFilter[],
    ) {}
}

export interface FindEmployeesByQualificationEmployeeResponse {
    employeeId: string;
    userId?: string;
    firstName: string;
    lastName: string;
    qualifications: { key: string; type: string; value: string }[];
}

export interface FindEmployeesByQualificationResponse {
    employees: FindEmployeesByQualificationEmployeeResponse[];
}
