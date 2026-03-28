import { Query } from "@nestjs/cqrs";

export interface RouteScheduleItem {
    type: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    specificDates?: string[];
}

export interface RouteListItem {
    id: string;
    name: string;
    status: string;
    vehicleIds: string[];
    representativeIds: string[];
    visitPointIds: string[];
    schedule?: RouteScheduleItem;
}

export type ListRoutesResponse = RouteListItem[];

export class ListRoutesQuery extends Query<ListRoutesResponse> {
    constructor() {
        super();
    }
}
