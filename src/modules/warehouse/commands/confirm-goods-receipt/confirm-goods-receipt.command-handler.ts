import { Inject, NotFoundException } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodsReceiptRepositoryPort } from "../../database/goods-receipt.repository.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { StockEntryAggregate } from "../../domain/stock-entry.aggregate.js";
import { GOODS_RECEIPT_REPOSITORY_PORT, STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ConfirmGoodsReceiptCommand } from "./confirm-goods-receipt.command.js";

@CommandHandler(ConfirmGoodsReceiptCommand)
export class ConfirmGoodsReceiptCommandHandler implements ICommandHandler<ConfirmGoodsReceiptCommand> {
    constructor(
        @Inject(GOODS_RECEIPT_REPOSITORY_PORT)
        private readonly receiptRepo: GoodsReceiptRepositoryPort,

        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: ConfirmGoodsReceiptCommand): Promise<void> {
        const receipt = await this.receiptRepo.findOneById(cmd.receiptId);
        if (!receipt) {
            throw new NotFoundException(`Goods receipt ${cmd.receiptId} not found`);
        }

        receipt.confirm();

        const stockEntries: StockEntryAggregate[] = [];

        for (const line of receipt.lines) {
            const existing = await this.stockRepo.findByGoodAndWarehouse(line.goodId, receipt.targetWarehouseId);

            if (existing) {
                existing.receive(line.quantity, {
                    note: line.note,
                    locationDescription: line.locationDescription,
                    sectorId: line.sectorId,
                });
                stockEntries.push(existing);
            } else {
                stockEntries.push(
                    StockEntryAggregate.create({
                        goodId: line.goodId,
                        warehouseId: receipt.targetWarehouseId,
                        quantity: line.quantity,
                        sectorId: line.sectorId,
                        locationDescription: line.locationDescription,
                        note: line.note,
                    }),
                );
            }
        }

        await this.receiptRepo.save(receipt);
        await this.stockRepo.save(stockEntries);
        await this.uow.commit();

        for (const event of receipt.domainEvents) {
            await this.eventBus.publish(event);
        }
        receipt.clearEvents();

        for (const entry of stockEntries) {
            for (const event of entry.domainEvents) {
                await this.eventBus.publish(event);
            }
            entry.clearEvents();
        }
    }
}
