import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { WarehouseRepositoryPort } from "../../database/warehouse.repository.port.js";
import { Address } from "../../../../shared/value-objects/address.value-object.js";
import { WarehouseNotFoundError } from "../../domain/good.errors.js";
import { WAREHOUSE_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { EditWarehouseCommand } from "./edit-warehouse.command.js";

@CommandHandler(EditWarehouseCommand)
export class EditWarehouseCommandHandler implements ICommandHandler<EditWarehouseCommand> {
    constructor(
        @Inject(WAREHOUSE_REPOSITORY_PORT)
        private readonly warehouseRepo: WarehouseRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: EditWarehouseCommand): Promise<void> {
        const warehouse = await this.warehouseRepo.findOneById(cmd.warehouseId);
        if (!warehouse) {
            throw new WarehouseNotFoundError(cmd.warehouseId);
        }

        const updates: Parameters<typeof warehouse.update>[0] = {};

        if (cmd.name !== undefined) {
            updates.name = cmd.name;
        }
        if (cmd.address !== undefined) {
            updates.address = new Address({
                country: cmd.address.country ?? warehouse.address.country,
                postalCode: cmd.address.postalCode ?? warehouse.address.postalCode,
                state: cmd.address.state ?? warehouse.address.state,
                city: cmd.address.city ?? warehouse.address.city,
                street: cmd.address.street ?? warehouse.address.street,
            });
        }

        warehouse.update(updates);

        await this.warehouseRepo.save(warehouse);
        await this.uow.commit();
    }
}
