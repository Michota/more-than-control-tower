import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { VehicleAggregate } from "../domain/vehicle.aggregate.js";

export interface VehicleRepositoryPort extends RepositoryPort<VehicleAggregate> {
    findByVin(vin: string): Promise<VehicleAggregate | null>;
    findByLicensePlate(licensePlate: string): Promise<VehicleAggregate | null>;
}
