import { Injectable } from "@nestjs/common";
import { EntityManager, type FilterQuery } from "@mikro-orm/core";
import Decimal from "decimal.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { WalletAggregate } from "../domain/wallet.aggregate.js";
import { WalletTransactionEntity } from "../domain/wallet-transaction.entity.js";
import { WalletTransactionType } from "../domain/wallet-transaction-type.enum.js";
import { WalletTransactionMethod } from "../domain/wallet-transaction-method.enum.js";
import { Wallet } from "./wallet.entity.js";
import { WalletTransaction } from "./wallet-transaction.entity.js";
import { type WalletRepositoryPort } from "./wallet.repository.port.js";

@Injectable()
export class WalletRepository implements WalletRepositoryPort {
    constructor(private readonly em: EntityManager) {}

    async save(wallet: WalletAggregate): Promise<void> {
        await this.em.upsert(Wallet, {
            id: wallet.id as string,
            employeeId: wallet.properties.employeeId,
            currency: wallet.properties.currency,
        } as Wallet);
    }

    async saveTransactions(transactions: WalletTransactionEntity[]): Promise<void> {
        for (const tx of transactions) {
            const props = tx.properties;
            await this.em.upsert(WalletTransaction, {
                id: tx.id as string,
                walletId: props.walletId,
                type: props.type,
                amount: props.amount,
                currency: props.currency,
                method: props.method,
                reason: props.reason,
                initiatedBy: props.initiatedBy,
                occurredAt: props.occurredAt,
            } as WalletTransaction);
        }
    }

    async findByEmployeeId(employeeId: string): Promise<WalletAggregate | null> {
        const record = await this.em.findOne(Wallet, { employeeId });
        if (!record) {
            return null;
        }

        const balance = await this.computeBalance(record.id);

        return WalletAggregate.reconstitute(
            {
                id: record.id as EntityId,
                properties: {
                    employeeId: record.employeeId,
                    currency: record.currency,
                },
            },
            balance,
        );
    }

    async computeBalance(walletId: string): Promise<Decimal> {
        const connection = this.em.getConnection();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result: { balance: string }[] = await connection.execute(
            `SELECT COALESCE(
                SUM(CASE WHEN "type" = ? THEN "amount" ELSE -"amount" END),
                0
            ) AS "balance"
            FROM "wallet_transaction"
            WHERE "wallet_id" = ?`,
            [WalletTransactionType.CREDIT, walletId],
        );

        return new Decimal(result[0]?.balance ?? "0");
    }

    async findTransactions(walletId: string, from?: Date, to?: Date): Promise<WalletTransactionEntity[]> {
        const where: FilterQuery<WalletTransaction> = { walletId };

        if (from || to) {
            const dateFilter: Record<string, Date> = {};
            if (from) {
                dateFilter.$gte = from;
            }
            if (to) {
                dateFilter.$lte = to;
            }
            where.occurredAt = dateFilter;
        }

        const records = await this.em.find(WalletTransaction, where, { orderBy: { occurredAt: "DESC" } });

        return records.map((r) =>
            WalletTransactionEntity.reconstitute({
                id: r.id as EntityId,
                properties: {
                    walletId: r.walletId,
                    type: r.type as unknown as WalletTransactionType,
                    amount: String(r.amount),
                    currency: r.currency,
                    method: r.method as unknown as WalletTransactionMethod,
                    reason: r.reason,
                    initiatedBy: r.initiatedBy,
                    occurredAt: r.occurredAt,
                },
            }),
        );
    }
}
