import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import type { WarehouseRepositoryPort } from "../../database/warehouse.repository.port.js";
import { WarehouseHasStockError, WarehouseNotFoundError } from "../../domain/good.errors.js";
import { STOCK_ENTRY_REPOSITORY_PORT, WAREHOUSE_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ActivateWarehouseCommand, DeactivateWarehouseCommand } from "./change-warehouse-status.command.js";

@CommandHandler(DeactivateWarehouseCommand)
export class DeactivateWarehouseCommandHandler implements ICommandHandler<DeactivateWarehouseCommand> {
    constructor(
        @Inject(WAREHOUSE_REPOSITORY_PORT)
        private readonly warehouseRepo: WarehouseRepositoryPort,

        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: DeactivateWarehouseCommand): Promise<void> {
        const warehouse = await this.warehouseRepo.findOneById(cmd.warehouseId);
        if (!warehouse) {
            throw new WarehouseNotFoundError(cmd.warehouseId);
        }

        const stock = await this.stockRepo.findByWarehouse(cmd.warehouseId);
        const hasStock = stock.some((e) => e.quantity > 0);
        if (hasStock) {
            throw new WarehouseHasStockError(cmd.warehouseId);
        }

        warehouse.deactivate();

        await this.warehouseRepo.save(warehouse);
        await this.uow.commit();
    }
}

@CommandHandler(ActivateWarehouseCommand)
export class ActivateWarehouseCommandHandler implements ICommandHandler<ActivateWarehouseCommand> {
    constructor(
        @Inject(WAREHOUSE_REPOSITORY_PORT)
        private readonly warehouseRepo: WarehouseRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: ActivateWarehouseCommand): Promise<void> {
        const warehouse = await this.warehouseRepo.findOneById(cmd.warehouseId);
        if (!warehouse) {
            throw new WarehouseNotFoundError(cmd.warehouseId);
        }

        warehouse.activate();

        await this.warehouseRepo.save(warehouse);
        await this.uow.commit();
    }
}
