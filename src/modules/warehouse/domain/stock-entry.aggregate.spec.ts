import { randomUUID } from "crypto";
import { StockEntryAggregate } from "./stock-entry.aggregate.js";
import { StockEventType } from "./stock-event-type.enum.js";
import { StockRemovalReason } from "./stock-removal-reason.enum.js";
import { InsufficientStockError } from "./good.errors.js";
import { StockReceivedDomainEvent } from "./events/stock-received.domain-event.js";
import { StockRemovedDomainEvent } from "./events/stock-removed.domain-event.js";
import { StockTransferredDomainEvent } from "./events/stock-transferred.domain-event.js";

const goodId = randomUUID();
const warehouseId = randomUUID();
const otherWarehouseId = randomUUID();
const sectorId = randomUUID();

describe("StockEntryAggregate.create()", () => {
    it("creates with initial quantity and history entry", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50 });

        expect(entry.goodId).toBe(goodId);
        expect(entry.warehouseId).toBe(warehouseId);
        expect(entry.quantity).toBe(50);
        expect(entry.history).toHaveLength(1);
        expect(entry.history[0].eventType).toBe(StockEventType.RECEIVED);
        expect(entry.history[0].quantityAfter).toBe(50);
    });

    it("emits StockReceivedDomainEvent", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 10 });

        expect(entry.domainEvents).toHaveLength(1);
        expect(entry.domainEvents[0]).toBeInstanceOf(StockReceivedDomainEvent);
    });

    it("accepts optional sectorId", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 10, sectorId });

        expect(entry.sectorId).toBe(sectorId);
    });
});

describe("StockEntryAggregate.receive()", () => {
    it("increments quantity", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50 });

        entry.receive(30);

        expect(entry.quantity).toBe(80);
    });

    it("adds history entry", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50 });

        entry.receive(30, { note: "restock" });

        expect(entry.history).toHaveLength(2);
        expect(entry.history[1].eventType).toBe(StockEventType.RECEIVED);
        expect(entry.history[1].quantityDelta).toBe(30);
        expect(entry.history[1].quantityAfter).toBe(80);
    });

    it("updates sectorId when provided", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50 });

        entry.receive(10, { sectorId });

        expect(entry.sectorId).toBe(sectorId);
    });
});

describe("StockEntryAggregate.remove()", () => {
    it("decrements quantity", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 100 });

        entry.remove(30, StockRemovalReason.SALE);

        expect(entry.quantity).toBe(70);
    });

    it("emits StockRemovedDomainEvent", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 100 });
        entry.clearEvents();

        entry.remove(10, StockRemovalReason.DAMAGE, "broken");

        expect(entry.domainEvents).toHaveLength(1);
        expect(entry.domainEvents[0]).toBeInstanceOf(StockRemovedDomainEvent);
    });

    it("records removal reason in history", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 100 });

        entry.remove(5, StockRemovalReason.DAMAGE, "cracked");

        const last = entry.history[entry.history.length - 1];
        expect(last.eventType).toBe(StockEventType.REMOVED);
        expect(last.removalReason).toBe(StockRemovalReason.DAMAGE);
        expect(last.quantityDelta).toBe(-5);
    });

    it("throws InsufficientStockError when removing more than available", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 10 });

        expect(() => entry.remove(20, StockRemovalReason.SALE)).toThrow(InsufficientStockError);
    });

    it("allows removing exact available quantity", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 10 });

        entry.remove(10, StockRemovalReason.SALE);

        expect(entry.quantity).toBe(0);
    });
});

describe("StockEntryAggregate.transferOut()", () => {
    it("decrements quantity and records destination", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 100 });

        entry.transferOut(40, otherWarehouseId);

        expect(entry.quantity).toBe(60);
        const last = entry.history[entry.history.length - 1];
        expect(last.eventType).toBe(StockEventType.TRANSFERRED_OUT);
        expect(last.relatedWarehouseId).toBe(otherWarehouseId);
    });

    it("emits StockTransferredDomainEvent", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 100 });
        entry.clearEvents();

        entry.transferOut(40, otherWarehouseId);

        expect(entry.domainEvents).toHaveLength(1);
        expect(entry.domainEvents[0]).toBeInstanceOf(StockTransferredDomainEvent);
    });

    it("throws InsufficientStockError when transferring more than available", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 10 });

        expect(() => entry.transferOut(50, otherWarehouseId)).toThrow(InsufficientStockError);
    });
});

describe("StockEntryAggregate.transferIn()", () => {
    it("increments quantity and records source", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50 });

        entry.transferIn(20, otherWarehouseId);

        expect(entry.quantity).toBe(70);
        const last = entry.history[entry.history.length - 1];
        expect(last.eventType).toBe(StockEventType.TRANSFERRED_IN);
        expect(last.relatedWarehouseId).toBe(otherWarehouseId);
    });

    it("does not emit a domain event (transfer event emitted by source)", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50 });
        entry.clearEvents();

        entry.transferIn(20, otherWarehouseId);

        expect(entry.domainEvents).toHaveLength(0);
    });

    it("updates sectorId when provided", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50 });

        entry.transferIn(10, otherWarehouseId, { sectorId });

        expect(entry.sectorId).toBe(sectorId);
    });
});

describe("StockEntryAggregate.moveToSector()", () => {
    it("changes sectorId without affecting quantity", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50, sectorId });
        const newSectorId = randomUUID();

        entry.moveToSector(newSectorId);

        expect(entry.sectorId).toBe(newSectorId);
        expect(entry.quantity).toBe(50);
    });

    it("records MOVED_SECTOR history entry", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50 });
        const newSectorId = randomUUID();

        entry.moveToSector(newSectorId, "reorganization");

        const last = entry.history[entry.history.length - 1];
        expect(last.eventType).toBe(StockEventType.MOVED_SECTOR);
        expect(last.quantityDelta).toBe(0);
        expect(last.relatedSectorId).toBe(newSectorId);
    });

    it("clears sectorId when undefined is passed", () => {
        const entry = StockEntryAggregate.create({ goodId, warehouseId, quantity: 50, sectorId });

        entry.moveToSector(undefined);

        expect(entry.sectorId).toBeUndefined();
    });
});
