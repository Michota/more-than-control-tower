import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import type { RouteRepositoryPort } from "../../database/route.repository.port.js";
import { JourneyAggregate } from "../../domain/journey.aggregate.js";
import { RouteNotFoundError } from "../../domain/route.errors.js";
import { JOURNEY_REPOSITORY_PORT, ROUTE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { CreateJourneyCommand } from "./create-journey.command.js";

@CommandHandler(CreateJourneyCommand)
export class CreateJourneyCommandHandler implements ICommandHandler<CreateJourneyCommand> {
    constructor(
        @Inject(ROUTE_REPOSITORY_PORT)
        private readonly routeRepo: RouteRepositoryPort,

        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateJourneyCommand): Promise<IdOfEntity<JourneyAggregate>> {
        const route = await this.routeRepo.findOneById(cmd.routeId);
        if (!route) {
            throw new RouteNotFoundError(cmd.routeId);
        }

        const journey = JourneyAggregate.createFromRoute({
            routeId: route.id as string,
            routeName: route.name,
            scheduledDate: cmd.scheduledDate,
            vehicleIds: route.vehicleIds,
            representativeIds: route.representativeIds,
            visitPointIds: route.visitPointIds,
        });

        await this.journeyRepo.save(journey);
        await this.uow.commit();

        for (const event of journey.domainEvents) {
            await this.eventBus.publish(event);
        }
        journey.clearEvents();

        return journey.id;
    }
}
