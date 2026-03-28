import { Query } from "@nestjs/cqrs";

export interface JourneyStopItem {
    customerId: string;
    customerName: string;
    address: {
        country: string;
        postalCode: string;
        state: string;
        city: string;
        street: string;
    };
    orderIds: string[];
    sequence: number;
}

export interface JourneyListItem {
    id: string;
    routeId: string;
    routeName: string;
    status: string;
    scheduledDate: string;
    vehicleIds: string[];
    representativeIds: string[];
    stops: JourneyStopItem[];
    loadingDeadline?: string;
}

export type ListJourneysResponse = JourneyListItem[];

export class ListJourneysQuery extends Query<ListJourneysResponse> {
    constructor() {
        super();
    }
}
