import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { WalletNotFoundError } from "../../domain/wallet.errors.js";
import type { WalletRepositoryPort } from "../../database/wallet.repository.port.js";
import { WALLET_REPOSITORY_PORT } from "../../erp.di-tokens.js";
import {
    GetWalletTransactionsQuery,
    type GetWalletTransactionsResponse,
    type WalletTransactionItem,
} from "./get-wallet-transactions.query.js";

@QueryHandler(GetWalletTransactionsQuery)
export class GetWalletTransactionsQueryHandler implements IQueryHandler<
    GetWalletTransactionsQuery,
    GetWalletTransactionsResponse
> {
    constructor(
        @Inject(WALLET_REPOSITORY_PORT)
        private readonly walletRepo: WalletRepositoryPort,
    ) {}

    async execute(query: GetWalletTransactionsQuery): Promise<GetWalletTransactionsResponse> {
        const wallet = await this.walletRepo.findByEmployeeId(query.employeeId);

        if (!wallet) {
            throw new WalletNotFoundError(query.employeeId);
        }

        const from = query.dateFrom ? new Date(query.dateFrom) : undefined;
        const to = query.dateTo ? new Date(query.dateTo + "T23:59:59.999Z") : undefined;

        const transactions = await this.walletRepo.findTransactions(wallet.id as string, from, to);

        return transactions.map(
            (tx): WalletTransactionItem => ({
                id: tx.id as string,
                type: tx.properties.type,
                amount: tx.properties.amount,
                currency: tx.properties.currency,
                method: tx.properties.method,
                reason: tx.properties.reason,
                initiatedBy: tx.properties.initiatedBy,
                occurredAt: tx.properties.occurredAt.toISOString(),
            }),
        );
    }
}
