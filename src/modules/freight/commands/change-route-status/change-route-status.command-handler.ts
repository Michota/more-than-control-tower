import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { RouteRepositoryPort } from "../../database/route.repository.port.js";
import { RouteNotFoundError } from "../../domain/route.errors.js";
import { ROUTE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { ActivateRouteCommand, DeactivateRouteCommand } from "./change-route-status.command.js";

@CommandHandler(ActivateRouteCommand)
export class ActivateRouteCommandHandler implements ICommandHandler<ActivateRouteCommand> {
    constructor(
        @Inject(ROUTE_REPOSITORY_PORT)
        private readonly routeRepo: RouteRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: ActivateRouteCommand): Promise<void> {
        const route = await this.routeRepo.findOneById(cmd.routeId);
        if (!route) {
            throw new RouteNotFoundError(cmd.routeId);
        }

        route.activate();

        await this.routeRepo.save(route);
        await this.uow.commit();
    }
}

@CommandHandler(DeactivateRouteCommand)
export class DeactivateRouteCommandHandler implements ICommandHandler<DeactivateRouteCommand> {
    constructor(
        @Inject(ROUTE_REPOSITORY_PORT)
        private readonly routeRepo: RouteRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: DeactivateRouteCommand): Promise<void> {
        const route = await this.routeRepo.findOneById(cmd.routeId);
        if (!route) {
            throw new RouteNotFoundError(cmd.routeId);
        }

        route.deactivate();

        await this.routeRepo.save(route);
        await this.uow.commit();
    }
}
