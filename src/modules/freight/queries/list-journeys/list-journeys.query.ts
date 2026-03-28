import { Query } from "@nestjs/cqrs";

export interface JourneyListItem {
    id: string;
    routeId: string;
    routeName: string;
    status: string;
    scheduledDate: string;
    vehicleIds: string[];
    representativeIds: string[];
    visitPointIds: string[];
}

export type ListJourneysResponse = JourneyListItem[];

export class ListJourneysQuery extends Query<ListJourneysResponse> {
    constructor() {
        super();
    }
}
