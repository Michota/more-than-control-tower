import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { RouteRepositoryPort } from "../../database/route.repository.port.js";
import { ROUTE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { ListRoutesQuery, ListRoutesResponse } from "./list-routes.query.js";

@QueryHandler(ListRoutesQuery)
export class ListRoutesQueryHandler implements IQueryHandler<ListRoutesQuery, ListRoutesResponse> {
    constructor(
        @Inject(ROUTE_REPOSITORY_PORT)
        private readonly routeRepo: RouteRepositoryPort,
    ) {}

    async execute(): Promise<ListRoutesResponse> {
        const routes = await this.routeRepo.findAll();

        return routes.map((r) => ({
            id: r.id as string,
            name: r.name,
            status: r.status,
            vehicleIds: r.vehicleIds,
            representativeIds: r.representativeIds,
            visitPointIds: r.visitPointIds,
            schedule: r.schedule
                ? {
                      type: r.schedule.type,
                      daysOfWeek: r.schedule.daysOfWeek,
                      daysOfMonth: r.schedule.daysOfMonth,
                      specificDates: r.schedule.specificDates,
                  }
                : undefined,
        }));
    }
}
