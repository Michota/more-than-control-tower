import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { StockEntryNotFoundError } from "../../domain/good.errors.js";
import { StockEntryAggregate } from "../../domain/stock-entry.aggregate.js";
import { STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { TransferStockCommand } from "./transfer-stock.command.js";

@CommandHandler(TransferStockCommand)
export class TransferStockCommandHandler implements ICommandHandler<TransferStockCommand> {
    constructor(
        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: TransferStockCommand): Promise<void> {
        const source = await this.stockRepo.findByGoodAndWarehouse(cmd.goodId, cmd.fromWarehouseId);
        if (!source) {
            throw new StockEntryNotFoundError(cmd.goodId, cmd.fromWarehouseId);
        }

        source.transferOut(cmd.quantity, cmd.toWarehouseId, cmd.note);

        const destination =
            (await this.stockRepo.findByGoodAndWarehouse(cmd.goodId, cmd.toWarehouseId)) ??
            StockEntryAggregate.create({
                goodId: cmd.goodId,
                warehouseId: cmd.toWarehouseId,
                quantity: 0,
            });

        destination.transferIn(cmd.quantity, cmd.fromWarehouseId, cmd.note, cmd.locationDescription);

        await this.stockRepo.save([source, destination]);
        await this.uow.commit();

        for (const event of source.domainEvents) {
            await this.eventBus.publish(event);
        }
        source.clearEvents();
        destination.clearEvents();
    }
}
