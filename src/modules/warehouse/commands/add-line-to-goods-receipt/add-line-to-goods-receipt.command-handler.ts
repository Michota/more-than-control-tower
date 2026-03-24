import { Inject, NotFoundException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodsReceiptRepositoryPort } from "../../database/goods-receipt.repository.port.js";
import { GOODS_RECEIPT_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { AddLineToGoodsReceiptCommand } from "./add-line-to-goods-receipt.command.js";

@CommandHandler(AddLineToGoodsReceiptCommand)
export class AddLineToGoodsReceiptCommandHandler implements ICommandHandler<AddLineToGoodsReceiptCommand> {
    constructor(
        @Inject(GOODS_RECEIPT_REPOSITORY_PORT)
        private readonly receiptRepo: GoodsReceiptRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: AddLineToGoodsReceiptCommand): Promise<void> {
        const receipt = await this.receiptRepo.findOneById(cmd.receiptId);
        if (!receipt) {
            throw new NotFoundException(`Goods receipt ${cmd.receiptId} not found`);
        }

        receipt.addLine(cmd.goodId, cmd.quantity, cmd.note, cmd.locationDescription);

        await this.receiptRepo.save(receipt);
        await this.uow.commit();
    }
}
