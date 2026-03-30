import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { StockTransferRequestRepositoryPort } from "../../database/stock-transfer-request.repository.port.js";
import { STOCK_TRANSFER_REQUEST_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { CancelTransferRequestsByRequesterCommand } from "../../../../shared/commands/cancel-transfer-requests-by-requester.command.js";

@CommandHandler(CancelTransferRequestsByRequesterCommand)
export class CancelTransferRequestsByRequesterCommandHandler implements ICommandHandler<CancelTransferRequestsByRequesterCommand> {
    constructor(
        @Inject(STOCK_TRANSFER_REQUEST_REPOSITORY_PORT)
        private readonly requestRepo: StockTransferRequestRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,
    ) {}

    async execute(cmd: CancelTransferRequestsByRequesterCommand): Promise<void> {
        const pendingRequests = await this.requestRepo.findPendingByRequestedBy(cmd.requestedBy);

        for (const request of pendingRequests) {
            request.cancel();
        }

        if (pendingRequests.length > 0) {
            await this.requestRepo.save(pendingRequests);
            await this.uow.commit();
        }
    }
}
