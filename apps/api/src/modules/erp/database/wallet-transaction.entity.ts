import { defineEntity, p } from "@mikro-orm/core";
import { WalletTransactionType } from "../domain/wallet-transaction-type.enum.js";
import { WalletTransactionMethod } from "../domain/wallet-transaction-method.enum.js";

const WalletTransactionSchema = defineEntity({
    name: "WalletTransaction",
    tableName: "wallet_transaction",
    properties: {
        id: p.uuid().primary(),
        walletId: p.uuid(),
        type: p.enum(() => WalletTransactionType),
        amount: p.decimal(),
        currency: p.string().length(3),
        method: p.enum(() => WalletTransactionMethod),
        reason: p.string(),
        initiatedBy: p.uuid(),
        occurredAt: p.type("timestamptz"),
    },
});

class WalletTransaction extends WalletTransactionSchema.class {}

WalletTransactionSchema.setClass(WalletTransaction);

export { WalletTransaction, WalletTransactionSchema };
