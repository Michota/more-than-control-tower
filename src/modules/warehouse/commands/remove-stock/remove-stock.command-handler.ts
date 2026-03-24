import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { StockEntryNotFoundError } from "../../domain/good.errors.js";
import { STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { RemoveStockCommand } from "./remove-stock.command.js";

@CommandHandler(RemoveStockCommand)
export class RemoveStockCommandHandler implements ICommandHandler<RemoveStockCommand> {
    constructor(
        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: RemoveStockCommand): Promise<void> {
        const entry = await this.stockRepo.findByGoodAndWarehouse(cmd.goodId, cmd.warehouseId);
        if (!entry) {
            throw new StockEntryNotFoundError(cmd.goodId, cmd.warehouseId);
        }

        entry.remove(cmd.quantity, cmd.reason, cmd.note);

        await this.stockRepo.save(entry);
        await this.uow.commit();

        for (const event of entry.domainEvents) {
            await this.eventBus.publish(event);
        }
        entry.clearEvents();
    }
}
