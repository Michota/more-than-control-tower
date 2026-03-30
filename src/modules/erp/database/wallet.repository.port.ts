import Decimal from "decimal.js";
import { WalletAggregate } from "../domain/wallet.aggregate.js";
import { WalletTransactionEntity } from "../domain/wallet-transaction.entity.js";

export interface WalletRepositoryPort {
    save(wallet: WalletAggregate): Promise<void>;
    saveTransactions(transactions: WalletTransactionEntity[]): Promise<void>;
    findByEmployeeId(employeeId: string): Promise<WalletAggregate | null>;
    computeBalance(walletId: string): Promise<Decimal>;
    findTransactions(walletId: string, from?: Date, to?: Date): Promise<WalletTransactionEntity[]>;
}
