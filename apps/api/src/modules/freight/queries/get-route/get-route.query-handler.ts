import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { RouteRepositoryPort } from "../../database/route.repository.port.js";
import { RouteNotFoundError } from "../../domain/route.errors.js";
import { ROUTE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { GetRouteQuery, GetRouteResponse } from "./get-route.query.js";

@QueryHandler(GetRouteQuery)
export class GetRouteQueryHandler implements IQueryHandler<GetRouteQuery, GetRouteResponse> {
    constructor(
        @Inject(ROUTE_REPOSITORY_PORT)
        private readonly routeRepo: RouteRepositoryPort,
    ) {}

    async execute(query: GetRouteQuery): Promise<GetRouteResponse> {
        const route = await this.routeRepo.findOneById(query.routeId);
        if (!route) {
            throw new RouteNotFoundError(query.routeId);
        }

        return {
            id: route.id as string,
            name: route.name,
            status: route.status,
            vehicleIds: route.vehicleIds,
            crewMembers: route.crewMembers.map((m) => ({
                employeeId: m.employeeId,
                employeeName: m.employeeName,
                role: m.role,
            })),
            stops: route.stops.map((s) => ({
                customerId: s.customerId,
                customerName: s.customerName,
                address: s.address,
                sequence: s.sequence,
            })),
            schedule: route.schedule
                ? {
                      type: route.schedule.type,
                      daysOfWeek: route.schedule.daysOfWeek,
                      daysOfMonth: route.schedule.daysOfMonth,
                      specificDates: route.schedule.specificDates,
                  }
                : undefined,
        };
    }
}
