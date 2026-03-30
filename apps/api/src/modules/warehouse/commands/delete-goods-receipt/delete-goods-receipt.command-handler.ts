import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodsReceiptRepositoryPort } from "../../database/goods-receipt.repository.port.js";
import { GoodsReceiptNotFoundError } from "../../domain/good.errors.js";
import { GOODS_RECEIPT_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { DeleteGoodsReceiptCommand } from "./delete-goods-receipt.command.js";

@CommandHandler(DeleteGoodsReceiptCommand)
export class DeleteGoodsReceiptCommandHandler implements ICommandHandler<DeleteGoodsReceiptCommand> {
    constructor(
        @Inject(GOODS_RECEIPT_REPOSITORY_PORT)
        private readonly receiptRepo: GoodsReceiptRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: DeleteGoodsReceiptCommand): Promise<void> {
        const receipt = await this.receiptRepo.findOneById(cmd.receiptId);
        if (!receipt) {
            throw new GoodsReceiptNotFoundError(cmd.receiptId);
        }
        await this.receiptRepo.delete(receipt);
        await this.uow.commit();
    }
}
