import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { StockEntryNotFoundError } from "../../domain/good.errors.js";
import { GOOD_REPOSITORY_PORT, STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { RemoveStockCommand } from "./remove-stock.command.js";

@CommandHandler(RemoveStockCommand)
export class RemoveStockCommandHandler implements ICommandHandler<RemoveStockCommand> {
    constructor(
        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: RemoveStockCommand): Promise<void> {
        const goodIds = await this.collectGoodAndChildrenIds(cmd.goodId);
        const allEntries = [];

        for (const goodId of goodIds) {
            const entry = await this.stockRepo.findByGoodAndWarehouse(goodId, cmd.warehouseId);
            if (!entry) {
                throw new StockEntryNotFoundError(goodId, cmd.warehouseId);
            }

            entry.remove(cmd.quantity, cmd.reason, cmd.note);
            allEntries.push(entry);
        }

        await this.stockRepo.save(allEntries);
        await this.uow.commit();

        for (const entry of allEntries) {
            for (const event of entry.domainEvents) {
                await this.eventBus.publish(event);
            }
            entry.clearEvents();
        }
    }

    private async collectGoodAndChildrenIds(goodId: string): Promise<string[]> {
        const children = await this.goodRepo.findByParentId(goodId);
        return [goodId, ...children.map((c) => c.id as string)];
    }
}
