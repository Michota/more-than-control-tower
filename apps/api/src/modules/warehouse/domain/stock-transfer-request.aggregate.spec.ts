import { randomUUID } from "crypto";
import { generateEntityId } from "../../../libs/ddd/utils/randomize-entity-id";
import { StockTransferRequestAggregate } from "./stock-transfer-request.aggregate";
import { StockTransferRequestStatus } from "./stock-transfer-request-status.enum";
import { StockTransferRequestNotPendingError } from "./stock-transfer-request.errors";
import { StockTransferRequestCreatedDomainEvent } from "./events/stock-transfer-request-created.domain-event";
import { StockTransferRequestFulfilledDomainEvent } from "./events/stock-transfer-request-fulfilled.domain-event";
import { uuidRegex } from "src/shared/utils/uuid-regex";

const validProps = () => ({
    goodId: randomUUID(),
    quantity: 10,
    fromWarehouseId: randomUUID(),
    toWarehouseId: randomUUID(),
    note: "Load for morning route",
    requestedBy: "freight",
});

describe("StockTransferRequestAggregate", () => {
    describe("create()", () => {
        it("creates a request in PENDING status", () => {
            const props = validProps();
            const request = StockTransferRequestAggregate.create(props);

            expect(request.id).toMatch(uuidRegex);
            expect(request.goodId).toEqual(props.goodId);
            expect(request.quantity).toEqual(10);
            expect(request.fromWarehouseId).toEqual(props.fromWarehouseId);
            expect(request.toWarehouseId).toEqual(props.toWarehouseId);
            expect(request.status).toEqual(StockTransferRequestStatus.PENDING);
            expect(request.note).toEqual("Load for morning route");
            expect(request.requestedBy).toEqual("freight");
            expect(request.rejectionReason).toBeUndefined();
        });

        it("emits StockTransferRequestCreatedDomainEvent", () => {
            const request = StockTransferRequestAggregate.create(validProps());

            expect(request.domainEvents).toHaveLength(1);
            expect(request.domainEvents[0]).toBeInstanceOf(StockTransferRequestCreatedDomainEvent);
        });

        it("throws when quantity is not a positive integer", () => {
            expect(() => StockTransferRequestAggregate.create({ ...validProps(), quantity: 0 })).toThrow();
            expect(() => StockTransferRequestAggregate.create({ ...validProps(), quantity: -1 })).toThrow();
            expect(() => StockTransferRequestAggregate.create({ ...validProps(), quantity: 1.5 })).toThrow();
        });

        it("throws when goodId is not a valid UUID", () => {
            expect(() => StockTransferRequestAggregate.create({ ...validProps(), goodId: "not-uuid" })).toThrow();
        });
    });

    describe("fulfill()", () => {
        it("transitions from PENDING to FULFILLED", () => {
            const request = StockTransferRequestAggregate.create(validProps());
            request.clearEvents();

            request.fulfill();

            expect(request.status).toEqual(StockTransferRequestStatus.FULFILLED);
        });

        it("emits StockTransferRequestFulfilledDomainEvent", () => {
            const request = StockTransferRequestAggregate.create(validProps());
            request.clearEvents();

            request.fulfill();

            expect(request.domainEvents).toHaveLength(1);
            expect(request.domainEvents[0]).toBeInstanceOf(StockTransferRequestFulfilledDomainEvent);
        });

        it("throws when not in PENDING status", () => {
            const request = StockTransferRequestAggregate.create(validProps());
            request.fulfill();

            expect(() => request.fulfill()).toThrow(StockTransferRequestNotPendingError);
        });
    });

    describe("cancel()", () => {
        it("transitions from PENDING to CANCELLED", () => {
            const request = StockTransferRequestAggregate.create(validProps());

            request.cancel();

            expect(request.status).toEqual(StockTransferRequestStatus.CANCELLED);
        });

        it("throws when not in PENDING status", () => {
            const request = StockTransferRequestAggregate.create(validProps());
            request.cancel();

            expect(() => request.cancel()).toThrow(StockTransferRequestNotPendingError);
        });
    });

    describe("reject()", () => {
        it("transitions from PENDING to REJECTED with reason", () => {
            const request = StockTransferRequestAggregate.create(validProps());

            request.reject("Insufficient stock available");

            expect(request.status).toEqual(StockTransferRequestStatus.REJECTED);
            expect(request.rejectionReason).toEqual("Insufficient stock available");
        });

        it("throws when not in PENDING status", () => {
            const request = StockTransferRequestAggregate.create(validProps());
            request.reject("reason");

            expect(() => request.reject("another reason")).toThrow(StockTransferRequestNotPendingError);
        });
    });

    describe("reconstitute()", () => {
        it("reconstitutes from persisted data", () => {
            const id = generateEntityId();
            const props = validProps();
            const request = StockTransferRequestAggregate.reconstitute({
                id,
                properties: {
                    ...props,
                    status: StockTransferRequestStatus.FULFILLED,
                    rejectionReason: undefined,
                },
            });

            expect(request.id).toEqual(id);
            expect(request.status).toEqual(StockTransferRequestStatus.FULFILLED);
            expect(request.domainEvents).toHaveLength(0);
        });
    });
});
