import { z } from "zod";
import { Decimal } from "decimal.js";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { WalletTransactionEntity } from "./wallet-transaction.entity.js";
import { WalletTransactionType } from "./wallet-transaction-type.enum.js";
import { WalletTransactionMethod } from "./wallet-transaction-method.enum.js";
import { InsufficientWalletBalanceError } from "./wallet.errors.js";
import { WalletCreditedDomainEvent } from "./events/wallet-credited.domain-event.js";
import { WalletDebitedDomainEvent } from "./events/wallet-debited.domain-event.js";
import { WalletChargedDomainEvent } from "./events/wallet-charged.domain-event.js";

export interface WalletProperties {
    employeeId: string;
    currency: string;
}

const walletSchema = z.object({
    employeeId: z.uuid(),
    currency: z.string().length(3),
});

export class WalletAggregate extends AggregateRoot<WalletProperties> {
    private _balance = new Decimal(0);
    private _pendingTransactions: WalletTransactionEntity[] = [];

    static create(properties: WalletProperties): WalletAggregate {
        const wallet = new WalletAggregate({ properties });
        wallet.validate();
        return wallet;
    }

    static reconstitute(props: EntityProps<WalletProperties>, balance: Decimal): WalletAggregate {
        const wallet = new WalletAggregate(props);
        wallet._balance = balance;
        return wallet;
    }

    validate(): void {
        walletSchema.parse(this.properties);
    }

    get balance(): Decimal {
        return this._balance;
    }

    get pendingTransactions(): WalletTransactionEntity[] {
        return this._pendingTransactions;
    }

    credit(amount: string, method: WalletTransactionMethod, reason: string, initiatedBy: string): void {
        const tx = WalletTransactionEntity.create({
            walletId: this.id as string,
            type: WalletTransactionType.CREDIT,
            amount,
            currency: this.properties.currency,
            method,
            reason,
            initiatedBy,
            occurredAt: new Date(),
        });

        this._balance = this._balance.add(new Decimal(amount));
        this._pendingTransactions.push(tx);

        this.addEvent(
            new WalletCreditedDomainEvent({
                aggregateId: this.id,
                employeeId: this.properties.employeeId,
                amount,
                currency: this.properties.currency,
                reason,
            }),
        );
    }

    debit(amount: string, method: WalletTransactionMethod, reason: string, initiatedBy: string): void {
        const debitAmount = new Decimal(amount);

        if (this._balance.lessThan(debitAmount)) {
            throw new InsufficientWalletBalanceError(this.id as string);
        }

        const tx = WalletTransactionEntity.create({
            walletId: this.id as string,
            type: WalletTransactionType.DEBIT,
            amount,
            currency: this.properties.currency,
            method,
            reason,
            initiatedBy,
            occurredAt: new Date(),
        });

        this._balance = this._balance.sub(debitAmount);
        this._pendingTransactions.push(tx);

        this.addEvent(
            new WalletDebitedDomainEvent({
                aggregateId: this.id,
                employeeId: this.properties.employeeId,
                amount,
                currency: this.properties.currency,
                reason,
            }),
        );
    }

    /**
     * Charge is a penalty deduction (e.g. damaged goods, theft).
     * Unlike debit, it can push the balance below zero — the employee owes the company.
     */
    charge(amount: string, reason: string, initiatedBy: string): void {
        const tx = WalletTransactionEntity.create({
            walletId: this.id as string,
            type: WalletTransactionType.CHARGE,
            amount,
            currency: this.properties.currency,
            method: WalletTransactionMethod.OTHER,
            reason,
            initiatedBy,
            occurredAt: new Date(),
        });

        this._balance = this._balance.sub(new Decimal(amount));
        this._pendingTransactions.push(tx);

        this.addEvent(
            new WalletChargedDomainEvent({
                aggregateId: this.id,
                employeeId: this.properties.employeeId,
                amount,
                currency: this.properties.currency,
                reason,
            }),
        );
    }
}
