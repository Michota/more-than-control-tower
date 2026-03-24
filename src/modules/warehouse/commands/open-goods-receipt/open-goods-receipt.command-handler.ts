import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodsReceiptRepositoryPort } from "../../database/goods-receipt.repository.port.js";
import { GoodsReceiptAggregate } from "../../domain/goods-receipt.aggregate.js";
import { GOODS_RECEIPT_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { OpenGoodsReceiptCommand } from "./open-goods-receipt.command.js";

@CommandHandler(OpenGoodsReceiptCommand)
export class OpenGoodsReceiptCommandHandler implements ICommandHandler<OpenGoodsReceiptCommand> {
    constructor(
        @Inject(GOODS_RECEIPT_REPOSITORY_PORT)
        private readonly receiptRepo: GoodsReceiptRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: OpenGoodsReceiptCommand): Promise<IdOfEntity<GoodsReceiptAggregate>> {
        const receipt = GoodsReceiptAggregate.open({
            targetWarehouseId: cmd.targetWarehouseId,
            note: cmd.note,
        });

        await this.receiptRepo.save(receipt);
        await this.uow.commit();

        return receipt.id;
    }
}
