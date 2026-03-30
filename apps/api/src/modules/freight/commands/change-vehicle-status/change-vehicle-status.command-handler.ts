import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { VehicleNotFoundError } from "../../domain/vehicle.errors.js";
import { VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { ActivateVehicleCommand, DeactivateVehicleCommand } from "./change-vehicle-status.command.js";

@CommandHandler(ActivateVehicleCommand)
export class ActivateVehicleCommandHandler implements ICommandHandler<ActivateVehicleCommand> {
    constructor(
        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: ActivateVehicleCommand): Promise<void> {
        const vehicle = await this.vehicleRepo.findOneById(cmd.vehicleId);
        if (!vehicle) {
            throw new VehicleNotFoundError(cmd.vehicleId);
        }

        vehicle.activate();

        await this.vehicleRepo.save(vehicle);
        await this.uow.commit();

        for (const event of vehicle.domainEvents) {
            await this.eventBus.publish(event);
        }
        vehicle.clearEvents();
    }
}

@CommandHandler(DeactivateVehicleCommand)
export class DeactivateVehicleCommandHandler implements ICommandHandler<DeactivateVehicleCommand> {
    constructor(
        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: DeactivateVehicleCommand): Promise<void> {
        const vehicle = await this.vehicleRepo.findOneById(cmd.vehicleId);
        if (!vehicle) {
            throw new VehicleNotFoundError(cmd.vehicleId);
        }

        vehicle.deactivate();

        await this.vehicleRepo.save(vehicle);
        await this.uow.commit();

        for (const event of vehicle.domainEvents) {
            await this.eventBus.publish(event);
        }
        vehicle.clearEvents();
    }
}
