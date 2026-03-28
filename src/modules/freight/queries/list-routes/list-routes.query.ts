import { Query } from "@nestjs/cqrs";

export interface RouteScheduleItem {
    type: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    specificDates?: string[];
}

export interface RouteStopItem {
    customerId: string;
    customerName: string;
    address: {
        country: string;
        postalCode: string;
        state: string;
        city: string;
        street: string;
    };
    sequence: number;
}

export interface RouteListItem {
    id: string;
    name: string;
    status: string;
    vehicleIds: string[];
    representativeIds: string[];
    stops: RouteStopItem[];
    schedule?: RouteScheduleItem;
}

export type ListRoutesResponse = RouteListItem[];

export class ListRoutesQuery extends Query<ListRoutesResponse> {
    constructor() {
        super();
    }
}
