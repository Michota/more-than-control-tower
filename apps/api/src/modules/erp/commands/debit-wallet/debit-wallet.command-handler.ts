import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { WalletTransactionMethod } from "../../domain/wallet-transaction-method.enum.js";
import { WalletNotFoundError } from "../../domain/wallet.errors.js";
import type { WalletRepositoryPort } from "../../database/wallet.repository.port.js";
import { WALLET_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { DebitWalletCommand } from "./debit-wallet.command.js";

@CommandHandler(DebitWalletCommand)
export class DebitWalletCommandHandler implements ICommandHandler<DebitWalletCommand> {
    constructor(
        @Inject(WALLET_REPOSITORY_PORT)
        private readonly walletRepo: WalletRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: DebitWalletCommand): Promise<void> {
        const wallet = await this.walletRepo.findByEmployeeId(cmd.employeeId);

        if (!wallet) {
            throw new WalletNotFoundError(cmd.employeeId);
        }

        wallet.debit(cmd.amount, cmd.method as WalletTransactionMethod, cmd.reason, cmd.actorId);

        await this.walletRepo.saveTransactions(wallet.pendingTransactions);
        await this.uow.commit();

        this.eventBus.publishAll(wallet.domainEvents);
        wallet.clearEvents();
    }
}
