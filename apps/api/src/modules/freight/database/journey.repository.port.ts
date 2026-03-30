import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { JourneyAggregate } from "../domain/journey.aggregate.js";

export interface JourneyRepositoryPort extends RepositoryPort<JourneyAggregate> {
    findByRouteAndDate(routeId: string, scheduledDate: string): Promise<JourneyAggregate | null>;
    findActiveByDate(scheduledDate: string): Promise<JourneyAggregate[]>;
}
