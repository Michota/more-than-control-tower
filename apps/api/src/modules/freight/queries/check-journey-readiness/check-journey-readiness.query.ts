import { Query } from "@nestjs/cqrs";

export interface ReadinessCheckItem {
    check: string;
    passed: boolean;
    reason?: string;
}

export interface CheckJourneyReadinessResponse {
    journeyId: string;
    ready: boolean;
    checks: ReadinessCheckItem[];
}

export class CheckJourneyReadinessQuery extends Query<CheckJourneyReadinessResponse> {
    constructor(public readonly journeyId: string) {
        super();
    }
}
