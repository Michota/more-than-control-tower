import { Query } from "@nestjs/cqrs";

export interface ActivityListItem {
    id: string;
    name: string;
    description?: string;
}

export type ListActivitiesResponse = ActivityListItem[];

export class ListActivitiesQuery extends Query<ListActivitiesResponse> {
    constructor() {
        super();
    }
}
