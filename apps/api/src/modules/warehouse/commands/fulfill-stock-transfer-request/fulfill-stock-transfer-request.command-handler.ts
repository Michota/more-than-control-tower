import { Inject } from "@nestjs/common";
import { CommandBus, CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { StockTransferRequestRepositoryPort } from "../../database/stock-transfer-request.repository.port.js";
import { StockTransferRequestNotFoundError } from "../../domain/stock-transfer-request.errors.js";
import { TransferStockCommand } from "../transfer-stock/transfer-stock.command.js";
import { STOCK_TRANSFER_REQUEST_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { FulfillStockTransferRequestCommand } from "./fulfill-stock-transfer-request.command.js";

@CommandHandler(FulfillStockTransferRequestCommand)
export class FulfillStockTransferRequestCommandHandler implements ICommandHandler<FulfillStockTransferRequestCommand> {
    constructor(
        @Inject(STOCK_TRANSFER_REQUEST_REPOSITORY_PORT)
        private readonly requestRepo: StockTransferRequestRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly commandBus: CommandBus,
        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: FulfillStockTransferRequestCommand): Promise<void> {
        const request = await this.requestRepo.findOneById(cmd.requestId);
        if (!request) {
            throw new StockTransferRequestNotFoundError(cmd.requestId);
        }

        // Guard status before attempting transfer
        request.fulfill();

        // Transfer stock first — if it fails (e.g. InsufficientStockError),
        // the request status change is never persisted
        await this.commandBus.execute(
            new TransferStockCommand({
                goodId: request.goodId,
                fromWarehouseId: request.fromWarehouseId,
                toWarehouseId: request.toWarehouseId,
                quantity: request.quantity,
                note: `Fulfilled transfer request ${request.id}`,
            }),
        );

        await this.requestRepo.save(request);
        await this.uow.commit();

        for (const event of request.domainEvents) {
            await this.eventBus.publish(event);
        }
        request.clearEvents();
    }
}
