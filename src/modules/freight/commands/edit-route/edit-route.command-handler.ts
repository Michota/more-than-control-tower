import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { RouteRepositoryPort } from "../../database/route.repository.port.js";
import { RouteSchedule } from "../../domain/route-schedule.value-object.js";
import { RouteStop } from "../../domain/route-stop.value-object.js";
import { RouteNotFoundError } from "../../domain/route.errors.js";
import { ROUTE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { EditRouteCommand } from "./edit-route.command.js";

@CommandHandler(EditRouteCommand)
export class EditRouteCommandHandler implements ICommandHandler<EditRouteCommand> {
    constructor(
        @Inject(ROUTE_REPOSITORY_PORT)
        private readonly routeRepo: RouteRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: EditRouteCommand): Promise<void> {
        const route = await this.routeRepo.findOneById(cmd.routeId);
        if (!route) {
            throw new RouteNotFoundError(cmd.routeId);
        }

        route.update({
            ...(cmd.name !== undefined && { name: cmd.name }),
            ...(cmd.vehicleIds !== undefined && { vehicleIds: cmd.vehicleIds }),
            ...(cmd.representativeIds !== undefined && { representativeIds: cmd.representativeIds }),
            ...(cmd.stops !== undefined && {
                stops: cmd.stops.map(
                    (s) =>
                        new RouteStop({
                            customerId: s.customerId,
                            customerName: s.customerName,
                            address: s.address,
                            sequence: s.sequence,
                        }),
                ),
            }),
            ...(cmd.schedule !== undefined && {
                schedule: new RouteSchedule({
                    type: cmd.schedule.type,
                    daysOfWeek: cmd.schedule.daysOfWeek,
                    daysOfMonth: cmd.schedule.daysOfMonth,
                    specificDates: cmd.schedule.specificDates,
                }),
            }),
        });

        await this.routeRepo.save(route);
        await this.uow.commit();
    }
}
