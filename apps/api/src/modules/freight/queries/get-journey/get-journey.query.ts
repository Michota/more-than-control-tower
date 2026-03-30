import { Query } from "@nestjs/cqrs";
import { JourneyListItem } from "../list-journeys/list-journeys.query.js";

export type GetJourneyResponse = JourneyListItem;

export class GetJourneyQuery extends Query<GetJourneyResponse> {
    constructor(public readonly journeyId: string) {
        super();
    }
}
