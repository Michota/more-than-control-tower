import { describe, it, expect, beforeEach } from "vitest";
import { t, registerEnum, setMessageSource } from "./t";

describe("t()", () => {
    beforeEach(() => {
        setMessageSource({
            hello: () => "Hello!",
            error_not_found: () => "Not found.",
            order_status_placed: () => "Placed",
            order_status_cancelled: () => "Cancelled",
        });
    });

    describe("string key lookup", () => {
        it("returns translated string when key exists", () => {
            expect(t("hello")).toBe("Hello!");
            expect(t("error_not_found")).toBe("Not found.");
        });

        it("returns the key itself when no translation exists and no fallback given", () => {
            expect(t("nonexistent_key")).toBe("nonexistent_key");
        });

        it("returns fallback when no translation exists and fallback is provided", () => {
            expect(t("nonexistent_key", "Fallback text")).toBe("Fallback text");
        });
    });

    describe("enum lookup", () => {
        const OrderStatus = { PLACED: "PLACED", CANCELLED: "CANCELLED" } as const;
        const UnregisteredEnum = { A: "A" } as const;

        beforeEach(() => {
            registerEnum(OrderStatus, "order_status");
        });

        it("translates enum value using registered prefix", () => {
            expect(t(OrderStatus, "PLACED")).toBe("Placed");
            expect(t(OrderStatus, "CANCELLED")).toBe("Cancelled");
        });

        it("returns raw value when enum is not registered", () => {
            expect(t(UnregisteredEnum, "A")).toBe("A");
        });

        it("returns raw value when message key does not exist for registered enum", () => {
            expect(t(OrderStatus, "UNKNOWN_VALUE")).toBe("UNKNOWN_VALUE");
        });
    });

    describe("setMessageSource()", () => {
        it("replaces the message source entirely", () => {
            expect(t("hello")).toBe("Hello!");

            setMessageSource({
                hello: () => "Cześć!",
            });

            expect(t("hello")).toBe("Cześć!");
            expect(t("error_not_found")).toBe("error_not_found");
        });
    });
});
