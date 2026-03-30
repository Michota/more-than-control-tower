import { Query } from "@nestjs/cqrs";

export interface EligibleDriverItem {
    employeeId: string;
    userId?: string;
    firstName: string;
    lastName: string;
}

export type ListEligibleDriversResponse = EligibleDriverItem[];

export class ListEligibleDriversQuery extends Query<ListEligibleDriversResponse> {
    constructor(public readonly vehicleId: string) {
        super();
    }
}
