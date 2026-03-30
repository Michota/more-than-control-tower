import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { ListVehiclesQuery, ListVehiclesResponse } from "./list-vehicles.query.js";

@QueryHandler(ListVehiclesQuery)
export class ListVehiclesQueryHandler implements IQueryHandler<ListVehiclesQuery, ListVehiclesResponse> {
    constructor(
        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,
    ) {}

    async execute(): Promise<ListVehiclesResponse> {
        const vehicles = await this.vehicleRepo.findAll();

        return vehicles.map((v) => ({
            id: v.id as string,
            name: v.name,
            status: v.status,
            requiredLicenseCategory: v.requiredLicenseCategory,
            attributes: v.attributes.map((a) => ({ name: a.name, value: a.value })),
            vin: v.vin,
            licensePlate: v.licensePlate,
            note: v.note,
            warehouseId: v.warehouseId,
        }));
    }
}
