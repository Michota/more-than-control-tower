import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryBus, QueryHandler } from "@nestjs/cqrs";
import {
    FindEmployeesByPermissionQuery,
    FindEmployeesByPermissionResponse,
} from "../../../../shared/queries/find-employees-by-permission.query.js";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { licenseToPermissionKey } from "../../domain/driver-license-permission.map.js";
import { VehicleNotFoundError } from "../../domain/vehicle.errors.js";
import { VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { ListEligibleDriversQuery, ListEligibleDriversResponse } from "./list-eligible-drivers.query.js";

@QueryHandler(ListEligibleDriversQuery)
export class ListEligibleDriversQueryHandler implements IQueryHandler<
    ListEligibleDriversQuery,
    ListEligibleDriversResponse
> {
    constructor(
        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: ListEligibleDriversQuery): Promise<ListEligibleDriversResponse> {
        const vehicle = await this.vehicleRepo.findOneById(query.vehicleId);
        if (!vehicle) {
            throw new VehicleNotFoundError(query.vehicleId);
        }

        const permissionKey = licenseToPermissionKey(vehicle.requiredLicenseCategory);

        const result = await this.queryBus.execute<FindEmployeesByPermissionQuery, FindEmployeesByPermissionResponse>(
            new FindEmployeesByPermissionQuery(permissionKey),
        );

        return result.employees.map((e) => ({
            employeeId: e.employeeId,
            userId: e.userId,
            firstName: e.firstName,
            lastName: e.lastName,
        }));
    }
}
