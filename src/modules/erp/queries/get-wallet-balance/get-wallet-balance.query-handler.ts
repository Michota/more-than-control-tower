import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { WalletRepositoryPort } from "../../database/wallet.repository.port.js";
import { WALLET_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import { GetWalletBalanceQuery, type WalletBalanceResponse } from "./get-wallet-balance.query.js";

@QueryHandler(GetWalletBalanceQuery)
export class GetWalletBalanceQueryHandler implements IQueryHandler<
    GetWalletBalanceQuery,
    WalletBalanceResponse | null
> {
    constructor(
        @Inject(WALLET_REPOSITORY_PORT)
        private readonly walletRepo: WalletRepositoryPort,
    ) {}

    async execute(query: GetWalletBalanceQuery): Promise<WalletBalanceResponse | null> {
        const wallet = await this.walletRepo.findByEmployeeId(query.employeeId);

        if (!wallet) {
            return null;
        }

        return {
            employeeId: wallet.properties.employeeId,
            currency: wallet.properties.currency,
            balance: wallet.balance.toFixed(2),
        };
    }
}
