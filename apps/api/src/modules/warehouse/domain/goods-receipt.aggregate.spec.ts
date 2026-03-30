import { randomUUID } from "crypto";
import { GoodsReceiptAggregate } from "./goods-receipt.aggregate.js";
import { GoodsReceiptStatus } from "./goods-receipt-status.enum.js";
import { GoodsReceiptConfirmedDomainEvent } from "./events/goods-receipt-confirmed.domain-event.js";
import { GoodsReceiptNotDraftError, GoodsReceiptHasNoLinesError } from "./good.errors.js";

const warehouseId = randomUUID();
const goodId1 = randomUUID();
const goodId2 = randomUUID();

describe("GoodsReceiptAggregate.open()", () => {
    it("opens a receipt in DRAFT status with empty lines", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });

        expect(receipt.status).toBe(GoodsReceiptStatus.DRAFT);
        expect(receipt.targetWarehouseId).toBe(warehouseId);
        expect(receipt.lines).toHaveLength(0);
    });

    it("accepts an optional note", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId, note: "Truck delivery" });

        expect(receipt.note).toBe("Truck delivery");
    });
});

describe("GoodsReceiptAggregate.setLines()", () => {
    it("sets lines on a DRAFT receipt", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });

        receipt.setLines([
            { goodId: goodId1, quantity: 10, note: "ok" },
            { goodId: goodId2, quantity: 5 },
        ]);

        expect(receipt.lines).toHaveLength(2);
        expect(receipt.lines[0].goodId).toBe(goodId1);
        expect(receipt.lines[0].quantity).toBe(10);
        expect(receipt.lines[1].goodId).toBe(goodId2);
    });

    it("replaces lines when called again", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });

        receipt.setLines([{ goodId: goodId1, quantity: 10 }]);
        receipt.setLines([{ goodId: goodId2, quantity: 20 }]);

        expect(receipt.lines).toHaveLength(1);
        expect(receipt.lines[0].goodId).toBe(goodId2);
    });

    it("clears lines when given empty array", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });
        receipt.setLines([{ goodId: goodId1, quantity: 10 }]);

        receipt.setLines([]);

        expect(receipt.lines).toHaveLength(0);
    });

    it("throws when receipt is CONFIRMED", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });
        receipt.setLines([{ goodId: goodId1, quantity: 10 }]);
        receipt.confirm();

        expect(() => receipt.setLines([{ goodId: goodId2, quantity: 5 }])).toThrow(GoodsReceiptNotDraftError);
    });
});

describe("GoodsReceiptAggregate.confirm()", () => {
    it("transitions from DRAFT to CONFIRMED", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });
        receipt.setLines([{ goodId: goodId1, quantity: 10 }]);

        receipt.confirm();

        expect(receipt.status).toBe(GoodsReceiptStatus.CONFIRMED);
    });

    it("emits GoodsReceiptConfirmedDomainEvent", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });
        receipt.setLines([{ goodId: goodId1, quantity: 10 }]);

        receipt.confirm();

        expect(receipt.domainEvents).toHaveLength(1);
        expect(receipt.domainEvents[0]).toBeInstanceOf(GoodsReceiptConfirmedDomainEvent);
    });

    it("throws when receipt has no lines", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });

        expect(() => receipt.confirm()).toThrow(GoodsReceiptHasNoLinesError);
    });

    it("throws when confirming an already confirmed receipt", () => {
        const receipt = GoodsReceiptAggregate.open({ targetWarehouseId: warehouseId });
        receipt.setLines([{ goodId: goodId1, quantity: 10 }]);
        receipt.confirm();

        expect(() => receipt.confirm()).toThrow(GoodsReceiptNotDraftError);
    });
});
