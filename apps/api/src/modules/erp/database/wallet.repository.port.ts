import { Decimal } from "decimal.js";
import { Paginated } from "../../../libs/ports/repository.port.js";
import { WalletAggregate } from "../domain/wallet.aggregate.js";
import { WalletTransactionEntity } from "../domain/wallet-transaction.entity.js";

export interface WalletListItemRecord {
    employeeId: string;
    currency: string;
    balance: string;
}

export interface WalletRepositoryPort {
    save(wallet: WalletAggregate): Promise<void>;
    saveTransactions(transactions: WalletTransactionEntity[]): Promise<void>;
    findByEmployeeId(employeeId: string): Promise<WalletAggregate | null>;
    computeBalance(walletId: string): Promise<Decimal>;
    findTransactions(walletId: string, from?: Date, to?: Date): Promise<WalletTransactionEntity[]>;
    findAllPaginated(page: number, limit: number, search?: string): Promise<Paginated<WalletListItemRecord>>;
}
