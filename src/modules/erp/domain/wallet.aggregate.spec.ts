import { randomUUID } from "crypto";
import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { WalletAggregate } from "./wallet.aggregate";
import { WalletTransactionMethod } from "./wallet-transaction-method.enum";
import { InsufficientWalletBalanceError } from "./wallet.errors";
import { EntityId } from "../../../libs/ddd/entities/entity-id";

describe("WalletAggregate", () => {
    const employeeId = randomUUID();
    const managerId = randomUUID();

    function createWallet() {
        return WalletAggregate.create({ employeeId, currency: "PLN" });
    }

    describe("create", () => {
        it("creates a wallet with zero balance", () => {
            const wallet = createWallet();

            expect(wallet.properties.employeeId).toBe(employeeId);
            expect(wallet.properties.currency).toBe("PLN");
            expect(wallet.balance.equals(new Decimal(0))).toBe(true);
        });
    });

    describe("credit", () => {
        it("increases balance", () => {
            const wallet = createWallet();

            wallet.credit("100.00", WalletTransactionMethod.CASH, "Fuel advance", managerId);

            expect(wallet.balance.equals(new Decimal("100.00"))).toBe(true);
            expect(wallet.pendingTransactions).toHaveLength(1);
            expect(wallet.domainEvents).toHaveLength(1);
        });

        it("accumulates multiple credits", () => {
            const wallet = createWallet();

            wallet.credit("50.00", WalletTransactionMethod.CASH, "Fuel", managerId);
            wallet.credit("30.00", WalletTransactionMethod.TRANSFER, "Toll", managerId);

            expect(wallet.balance.equals(new Decimal("80.00"))).toBe(true);
            expect(wallet.pendingTransactions).toHaveLength(2);
        });
    });

    describe("debit", () => {
        it("decreases balance", () => {
            const wallet = createWallet();
            wallet.credit("100.00", WalletTransactionMethod.CASH, "Fuel advance", managerId);

            wallet.debit("40.00", WalletTransactionMethod.CASH, "Fuel purchase", managerId);

            expect(wallet.balance.equals(new Decimal("60.00"))).toBe(true);
            expect(wallet.pendingTransactions).toHaveLength(2);
            expect(wallet.domainEvents).toHaveLength(2);
        });

        it("throws InsufficientWalletBalanceError when balance is too low", () => {
            const wallet = createWallet();
            wallet.credit("50.00", WalletTransactionMethod.CASH, "Fuel", managerId);

            expect(() => wallet.debit("100.00", WalletTransactionMethod.CASH, "Too much", managerId)).toThrow(
                InsufficientWalletBalanceError,
            );
        });

        it("allows debit of exact balance", () => {
            const wallet = createWallet();
            wallet.credit("50.00", WalletTransactionMethod.CASH, "Fuel", managerId);

            wallet.debit("50.00", WalletTransactionMethod.CASH, "Spend all", managerId);

            expect(wallet.balance.equals(new Decimal(0))).toBe(true);
        });
    });

    describe("reconstitute", () => {
        it("reconstitutes with precomputed balance", () => {
            const wallet = WalletAggregate.reconstitute(
                {
                    id: "wallet-id" as unknown as EntityId,
                    properties: { employeeId, currency: "PLN" },
                },
                new Decimal("150.00"),
            );

            expect(wallet.balance.equals(new Decimal("150.00"))).toBe(true);
            expect(wallet.domainEvents).toHaveLength(0);
        });
    });
});
