import { defineEntity, p } from "@mikro-orm/core";

const WalletSchema = defineEntity({
    name: "Wallet",
    tableName: "wallet",
    properties: {
        id: p.uuid().primary(),
        employeeId: p.uuid().unique(),
        currency: p.string().length(3),
    },
});

class Wallet extends WalletSchema.class {}

WalletSchema.setClass(Wallet);

export { Wallet, WalletSchema };
