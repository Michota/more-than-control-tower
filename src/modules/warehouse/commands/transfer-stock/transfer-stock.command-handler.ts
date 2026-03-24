import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { StockEntryNotFoundError } from "../../domain/good.errors.js";
import { StockEntryAggregate } from "../../domain/stock-entry.aggregate.js";
import { GOOD_REPOSITORY_PORT, STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { TransferStockCommand } from "./transfer-stock.command.js";

@CommandHandler(TransferStockCommand)
export class TransferStockCommandHandler implements ICommandHandler<TransferStockCommand> {
    constructor(
        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: TransferStockCommand): Promise<void> {
        const goodIds = await this.collectGoodAndChildrenIds(cmd.goodId);
        const allEntries: StockEntryAggregate[] = [];

        for (const goodId of goodIds) {
            const source = await this.stockRepo.findByGoodAndWarehouse(goodId, cmd.fromWarehouseId);
            if (!source) {
                throw new StockEntryNotFoundError(goodId, cmd.fromWarehouseId);
            }

            source.transferOut(cmd.quantity, cmd.toWarehouseId, cmd.note);

            const destination =
                (await this.stockRepo.findByGoodAndWarehouse(goodId, cmd.toWarehouseId)) ??
                StockEntryAggregate.create({
                    goodId,
                    warehouseId: cmd.toWarehouseId,
                    quantity: 0,
                });

            destination.transferIn(cmd.quantity, cmd.fromWarehouseId, {
                note: cmd.note,
                locationDescription: cmd.locationDescription,
                sectorId: cmd.sectorId,
            });

            allEntries.push(source, destination);
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
