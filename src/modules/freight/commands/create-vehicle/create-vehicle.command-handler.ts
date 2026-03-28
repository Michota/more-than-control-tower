import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { VehicleAttribute } from "../../domain/vehicle-attribute.value-object.js";
import { VehicleAggregate } from "../../domain/vehicle.aggregate.js";
import { VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import { CreateVehicleCommand } from "./create-vehicle.command.js";

@CommandHandler(CreateVehicleCommand)
export class CreateVehicleCommandHandler implements ICommandHandler<CreateVehicleCommand> {
    constructor(
        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateVehicleCommand): Promise<IdOfEntity<VehicleAggregate>> {
        const vehicle = VehicleAggregate.create({
            name: cmd.name,
            requiredLicenseCategory: cmd.requiredLicenseCategory,
            attributes: cmd.attributes?.map((a) => new VehicleAttribute({ name: a.name, value: a.value })),
            vin: cmd.vin,
            licensePlate: cmd.licensePlate,
            note: cmd.note,
            warehouseId: cmd.warehouseId,
        });

        await this.vehicleRepo.save(vehicle);
        await this.uow.commit();

        for (const event of vehicle.domainEvents) {
            await this.eventBus.publish(event);
        }
        vehicle.clearEvents();

        return vehicle.id;
    }
}
