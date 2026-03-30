import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { RequestStockTransferCommand } from "../../../../shared/commands/request-stock-transfer.command.js";
import type { StockTransferRequestRepositoryPort } from "../../database/stock-transfer-request.repository.port.js";
import { StockTransferRequestAggregate } from "../../domain/stock-transfer-request.aggregate.js";
import { STOCK_TRANSFER_REQUEST_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";

@CommandHandler(RequestStockTransferCommand)
export class RequestStockTransferCommandHandler implements ICommandHandler<RequestStockTransferCommand> {
    constructor(
        @Inject(STOCK_TRANSFER_REQUEST_REPOSITORY_PORT)
        private readonly requestRepo: StockTransferRequestRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: RequestStockTransferCommand): Promise<IdOfEntity<StockTransferRequestAggregate>> {
        const request = StockTransferRequestAggregate.create({
            goodId: cmd.goodId,
            quantity: cmd.quantity,
            fromWarehouseId: cmd.fromWarehouseId,
            toWarehouseId: cmd.toWarehouseId,
            note: cmd.note,
            requestedBy: cmd.requestedBy,
        });

        await this.requestRepo.save(request);
        await this.uow.commit();

        for (const event of request.domainEvents) {
            await this.eventBus.publish(event);
        }
        request.clearEvents();

        return request.id;
    }
}
