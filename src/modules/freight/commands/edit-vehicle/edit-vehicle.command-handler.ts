import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { VehicleAttribute } from "../../domain/vehicle-attribute.value-object.js";
import {
    VehicleLicensePlateAlreadyExistsError,
    VehicleNotFoundError,
    VehicleVinAlreadyExistsError,
} from "../../domain/vehicle.errors.js";
import { VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { EditVehicleCommand } from "./edit-vehicle.command.js";

@CommandHandler(EditVehicleCommand)
export class EditVehicleCommandHandler implements ICommandHandler<EditVehicleCommand> {
    constructor(
        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: EditVehicleCommand): Promise<void> {
        const vehicle = await this.vehicleRepo.findOneById(cmd.vehicleId);
        if (!vehicle) {
            throw new VehicleNotFoundError(cmd.vehicleId);
        }

        if (cmd.vin !== undefined && cmd.vin !== vehicle.vin) {
            const existing = await this.vehicleRepo.findByVin(cmd.vin);
            if (existing && existing.id !== vehicle.id) {
                throw new VehicleVinAlreadyExistsError(cmd.vin);
            }
        }
        if (cmd.licensePlate !== undefined && cmd.licensePlate !== vehicle.licensePlate) {
            const existing = await this.vehicleRepo.findByLicensePlate(cmd.licensePlate);
            if (existing && existing.id !== vehicle.id) {
                throw new VehicleLicensePlateAlreadyExistsError(cmd.licensePlate);
            }
        }

        vehicle.update({
            ...(cmd.name !== undefined && { name: cmd.name }),
            ...(cmd.requiredLicenseCategory !== undefined && { requiredLicenseCategory: cmd.requiredLicenseCategory }),
            ...(cmd.attributes !== undefined && {
                attributes: cmd.attributes.map((a) => new VehicleAttribute({ name: a.name, value: a.value })),
            }),
            ...(cmd.vin !== undefined && { vin: cmd.vin }),
            ...(cmd.licensePlate !== undefined && { licensePlate: cmd.licensePlate }),
            ...(cmd.note !== undefined && { note: cmd.note }),
            ...(cmd.warehouseId !== undefined && { warehouseId: cmd.warehouseId }),
        });

        await this.vehicleRepo.save(vehicle);
        await this.uow.commit();
    }
}
