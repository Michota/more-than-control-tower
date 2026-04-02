import { randomUUID } from "crypto";
import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";
import { WalletAggregate } from "./wallet.aggregate.js";
import { WalletTransactionMethod } from "./wallet-transaction-method.enum.js";
import { InsufficientWalletBalanceError } from "./wallet.errors.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";

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

    describe("charge", () => {
        it("deducts from balance", () => {
            const wallet = createWallet();
            wallet.credit("100.00", WalletTransactionMethod.CASH, "Fuel advance", managerId);

            wallet.charge("30.00", "Damaged goods", managerId);

            expect(wallet.balance.equals(new Decimal("70.00"))).toBe(true);
            expect(wallet.pendingTransactions).toHaveLength(2);
            expect(wallet.domainEvents).toHaveLength(2);
        });

        it("can push balance below zero", () => {
            const wallet = createWallet();
            wallet.credit("20.00", WalletTransactionMethod.CASH, "Small advance", managerId);

            wallet.charge("50.00", "Stolen equipment", managerId);

            expect(wallet.balance.equals(new Decimal("-30.00"))).toBe(true);
        });

        it("works on zero balance — employee owes the company", () => {
            const wallet = createWallet();

            wallet.charge("100.00", "Theft", managerId);

            expect(wallet.balance.equals(new Decimal("-100.00"))).toBe(true);
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
