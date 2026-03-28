import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import { JourneyNotFoundError } from "../../domain/journey.errors.js";
import { JOURNEY_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { GetJourneyQuery, GetJourneyResponse } from "./get-journey.query.js";

@QueryHandler(GetJourneyQuery)
export class GetJourneyQueryHandler implements IQueryHandler<GetJourneyQuery, GetJourneyResponse> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,
    ) {}

    async execute(query: GetJourneyQuery): Promise<GetJourneyResponse> {
        const journey = await this.journeyRepo.findOneById(query.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(query.journeyId);
        }

        return {
            id: journey.id as string,
            routeId: journey.routeId,
            routeName: journey.routeName,
            status: journey.status,
            scheduledDate: journey.scheduledDate,
            vehicleIds: journey.vehicleIds,
            representativeIds: journey.representativeIds,
            visitPointIds: journey.visitPointIds,
        };
    }
}
