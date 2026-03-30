import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { RouteRepositoryPort } from "../../database/route.repository.port.js";
import { RouteAggregate } from "../../domain/route.aggregate.js";
import { ROUTE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { CreateRouteCommand } from "./create-route.command.js";

@CommandHandler(CreateRouteCommand)
export class CreateRouteCommandHandler implements ICommandHandler<CreateRouteCommand> {
    constructor(
        @Inject(ROUTE_REPOSITORY_PORT)
        private readonly routeRepo: RouteRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateRouteCommand): Promise<IdOfEntity<RouteAggregate>> {
        const route = RouteAggregate.create({
            name: cmd.name,
        });

        await this.routeRepo.save(route);
        await this.uow.commit();

        for (const event of route.domainEvents) {
            await this.eventBus.publish(event);
        }
        route.clearEvents();

        return route.id;
    }
}
