import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodsReceiptRepositoryPort } from "../../database/goods-receipt.repository.port.js";
import { GoodsReceiptNotFoundError } from "../../domain/good.errors.js";
import { GOODS_RECEIPT_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { SetGoodsReceiptLinesCommand } from "./set-goods-receipt-lines.command.js";

@CommandHandler(SetGoodsReceiptLinesCommand)
export class SetGoodsReceiptLinesCommandHandler implements ICommandHandler<SetGoodsReceiptLinesCommand> {
    constructor(
        @Inject(GOODS_RECEIPT_REPOSITORY_PORT)
        private readonly receiptRepo: GoodsReceiptRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: SetGoodsReceiptLinesCommand): Promise<void> {
        const receipt = await this.receiptRepo.findOneById(cmd.receiptId);
        if (!receipt) {
            throw new GoodsReceiptNotFoundError(cmd.receiptId);
        }

        receipt.setLines(cmd.lines);

        await this.receiptRepo.save(receipt);
        await this.uow.commit();
    }
}
