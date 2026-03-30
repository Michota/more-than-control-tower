import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { VehicleNotFoundError } from "../../domain/vehicle.errors.js";
import { VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { GetVehicleQuery, GetVehicleResponse } from "./get-vehicle.query.js";

@QueryHandler(GetVehicleQuery)
export class GetVehicleQueryHandler implements IQueryHandler<GetVehicleQuery, GetVehicleResponse> {
    constructor(
        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,
    ) {}

    async execute(query: GetVehicleQuery): Promise<GetVehicleResponse> {
        const vehicle = await this.vehicleRepo.findOneById(query.vehicleId);
        if (!vehicle) {
            throw new VehicleNotFoundError(query.vehicleId);
        }

        return {
            id: vehicle.id as string,
            name: vehicle.name,
            status: vehicle.status,
            requiredLicenseCategory: vehicle.requiredLicenseCategory,
            attributes: vehicle.attributes.map((a) => ({ name: a.name, value: a.value })),
            vin: vehicle.vin,
            licensePlate: vehicle.licensePlate,
            note: vehicle.note,
            warehouseId: vehicle.warehouseId,
        };
    }
}
