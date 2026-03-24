import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { Address } from "../../../../shared/value-objects/address.value-object.js";
import type { WarehouseRepositoryPort } from "../../database/warehouse.repository.port.js";
import { GeoLocation } from "../../domain/geo-location.value-object.js";
import { WarehouseAggregate } from "../../domain/warehouse.aggregate.js";
import { WAREHOUSE_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { CreateWarehouseCommand } from "./create-warehouse.command.js";

@CommandHandler(CreateWarehouseCommand)
export class CreateWarehouseCommandHandler implements ICommandHandler<CreateWarehouseCommand> {
    constructor(
        @Inject(WAREHOUSE_REPOSITORY_PORT)
        private readonly warehouseRepo: WarehouseRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateWarehouseCommand): Promise<IdOfEntity<WarehouseAggregate>> {
        const warehouse = WarehouseAggregate.create({
            name: cmd.name,
            location: new GeoLocation({ latitude: cmd.latitude, longitude: cmd.longitude }),
            address: new Address({
                country: cmd.address.country,
                postalCode: cmd.address.postalCode,
                state: cmd.address.state,
                city: cmd.address.city,
                street: cmd.address.street,
            }),
        });

        await this.warehouseRepo.save(warehouse);
        await this.uow.commit();

        for (const event of warehouse.domainEvents) {
            await this.eventBus.publish(event);
        }
        warehouse.clearEvents();

        return warehouse.id;
    }
}
