import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import { JOURNEY_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import {
    CheckJourneyAvailabilityQuery,
    CheckJourneyAvailabilityResponse,
    RepresentativeAvailabilityItem,
    VehicleAvailabilityItem,
} from "./check-journey-availability.query.js";

@QueryHandler(CheckJourneyAvailabilityQuery)
export class CheckJourneyAvailabilityQueryHandler implements IQueryHandler<
    CheckJourneyAvailabilityQuery,
    CheckJourneyAvailabilityResponse
> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,
    ) {}

    async execute(query: CheckJourneyAvailabilityQuery): Promise<CheckJourneyAvailabilityResponse> {
        const activeJourneys = await this.journeyRepo.findActiveByDate(query.date);
        const otherJourneys = query.excludeJourneyId
            ? activeJourneys.filter((j) => j.id !== query.excludeJourneyId)
            : activeJourneys;

        const vehicles: VehicleAvailabilityItem[] = query.vehicleIds.map((vehicleId) => {
            const conflict = otherJourneys.find((j) => j.vehicleIds.includes(vehicleId));
            return {
                vehicleId,
                available: !conflict,
                conflictingJourneyId: conflict ? (conflict.id as string) : undefined,
            };
        });

        const representatives: RepresentativeAvailabilityItem[] = query.representativeIds.map((representativeId) => {
            const conflict = otherJourneys.find((j) => j.representativeIds.includes(representativeId));
            return {
                representativeId,
                available: !conflict,
                conflictingJourneyId: conflict ? (conflict.id as string) : undefined,
            };
        });

        return {
            date: query.date,
            vehicles,
            representatives,
        };
    }
}
