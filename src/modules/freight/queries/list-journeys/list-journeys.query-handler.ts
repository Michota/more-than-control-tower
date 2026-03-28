import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import { JOURNEY_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { ListJourneysQuery, ListJourneysResponse } from "./list-journeys.query.js";

@QueryHandler(ListJourneysQuery)
export class ListJourneysQueryHandler implements IQueryHandler<ListJourneysQuery, ListJourneysResponse> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,
    ) {}

    async execute(): Promise<ListJourneysResponse> {
        const journeys = await this.journeyRepo.findAll();

        return journeys.map((j) => ({
            id: j.id as string,
            routeId: j.routeId,
            routeName: j.routeName,
            status: j.status,
            scheduledDate: j.scheduledDate,
            vehicleIds: j.vehicleIds,
            representativeIds: j.representativeIds,
            stops: j.stops.map((s) => ({
                customerId: s.customerId,
                customerName: s.customerName,
                address: s.address,
                orderIds: s.orderIds,
                sequence: s.sequence,
            })),
        }));
    }
}
