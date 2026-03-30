import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { StockTransferRequestRepositoryPort } from "../../database/stock-transfer-request.repository.port.js";
import { StockTransferRequestNotFoundError } from "../../domain/stock-transfer-request.errors.js";
import { STOCK_TRANSFER_REQUEST_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { CancelStockTransferRequestCommand } from "./cancel-stock-transfer-request.command.js";

@CommandHandler(CancelStockTransferRequestCommand)
export class CancelStockTransferRequestCommandHandler implements ICommandHandler<CancelStockTransferRequestCommand> {
    constructor(
        @Inject(STOCK_TRANSFER_REQUEST_REPOSITORY_PORT)
        private readonly requestRepo: StockTransferRequestRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: CancelStockTransferRequestCommand): Promise<void> {
        const request = await this.requestRepo.findOneById(cmd.requestId);
        if (!request) {
            throw new StockTransferRequestNotFoundError(cmd.requestId);
        }

        request.cancel();

        await this.requestRepo.save(request);
        await this.uow.commit();
    }
}
