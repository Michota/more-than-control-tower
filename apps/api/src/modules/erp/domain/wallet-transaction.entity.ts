import { z } from "zod";
import { Entity, type CreateEntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { WalletTransactionType } from "./wallet-transaction-type.enum.js";
import { WalletTransactionMethod } from "./wallet-transaction-method.enum.js";

export interface WalletTransactionProperties {
    walletId: string;
    type: WalletTransactionType;
    amount: string;
    currency: string;
    method: WalletTransactionMethod;
    reason: string;
    initiatedBy: string;
    occurredAt: Date;
}

const walletTransactionSchema = z.object({
    walletId: z.uuid(),
    type: z.enum(["CREDIT", "DEBIT", "CHARGE"]),
    amount: z.string().refine((v) => Number(v) > 0, "Amount must be positive"),
    currency: z.string().length(3),
    method: z.enum(["CASH", "TRANSFER", "OTHER"]),
    reason: z.string().min(1).max(500),
    initiatedBy: z.uuid(),
    occurredAt: z.date(),
});

export class WalletTransactionEntity extends Entity<WalletTransactionProperties> {
    static create(properties: WalletTransactionProperties): WalletTransactionEntity {
        const tx = new WalletTransactionEntity({ properties });
        tx.validate();
        return tx;
    }

    static reconstitute(props: CreateEntityProps<WalletTransactionProperties>): WalletTransactionEntity {
        return new WalletTransactionEntity(props);
    }

    validate(): void {
        walletTransactionSchema.parse(this.properties);
    }
}
