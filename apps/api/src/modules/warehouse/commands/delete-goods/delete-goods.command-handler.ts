import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { GoodHasActiveStockError, GoodNotFoundError } from "../../domain/good.errors.js";
import { GOOD_REPOSITORY_PORT, STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { DeleteGoodsCommand } from "./delete-goods.command.js";

@CommandHandler(DeleteGoodsCommand)
export class DeleteGoodsCommandHandler implements ICommandHandler<DeleteGoodsCommand> {
    constructor(
        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,

        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: DeleteGoodsCommand): Promise<void> {
        for (const id of cmd.goodIds) {
            const good = await this.goodRepo.findOneById(id);
            if (!good) {
                throw new GoodNotFoundError(id);
            }

            const activeStock = await this.stockRepo.findActiveByGoodId(id);
            if (activeStock.length > 0) {
                throw new GoodHasActiveStockError(id);
            }

            await this.goodRepo.delete(good);
        }
        await this.uow.commit();
    }
}
