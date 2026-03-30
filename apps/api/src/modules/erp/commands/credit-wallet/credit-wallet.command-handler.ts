import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { WalletAggregate } from "../../domain/wallet.aggregate.js";
import { WalletTransactionMethod } from "../../domain/wallet-transaction-method.enum.js";
import type { WalletRepositoryPort } from "../../database/wallet.repository.port.js";
import { WALLET_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { CreditWalletCommand } from "./credit-wallet.command.js";

@CommandHandler(CreditWalletCommand)
export class CreditWalletCommandHandler implements ICommandHandler<CreditWalletCommand> {
    constructor(
        @Inject(WALLET_REPOSITORY_PORT)
        private readonly walletRepo: WalletRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreditWalletCommand): Promise<void> {
        let wallet = await this.walletRepo.findByEmployeeId(cmd.employeeId);

        if (!wallet) {
            wallet = WalletAggregate.create({
                employeeId: cmd.employeeId,
                currency: cmd.currency,
            });
            await this.walletRepo.save(wallet);
        }

        wallet.credit(cmd.amount, cmd.method as WalletTransactionMethod, cmd.reason, cmd.actorId);

        await this.walletRepo.saveTransactions(wallet.pendingTransactions);
        await this.uow.commit();

        this.eventBus.publishAll(wallet.domainEvents);
        wallet.clearEvents();
    }
}
