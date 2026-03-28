import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { RouteRepositoryPort } from "../../database/route.repository.port.js";
import { RouteNotFoundError } from "../../domain/route.errors.js";
import { ROUTE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { ArchiveRouteCommand } from "./archive-route.command.js";

@CommandHandler(ArchiveRouteCommand)
export class ArchiveRouteCommandHandler implements ICommandHandler<ArchiveRouteCommand> {
    constructor(
        @Inject(ROUTE_REPOSITORY_PORT)
        private readonly routeRepo: RouteRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: ArchiveRouteCommand): Promise<void> {
        const route = await this.routeRepo.findOneById(cmd.routeId);
        if (!route) {
            throw new RouteNotFoundError(cmd.routeId);
        }

        route.archive();

        await this.routeRepo.save(route);
        await this.uow.commit();

        for (const event of route.domainEvents) {
            await this.eventBus.publish(event);
        }
        route.clearEvents();
    }
}
