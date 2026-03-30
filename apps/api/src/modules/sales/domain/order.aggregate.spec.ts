import Decimal from "decimal.js";
import { randomUUID } from "crypto";
import { generateEntityId } from "../../../libs/ddd/utils/randomize-entity-id.js";
import { Currency } from "../../../shared/value-objects/currency.js";
import { Money } from "../../../shared/value-objects/money.js";
import { OrderAggregate } from "./order.aggregate.js";
import { OrderItemEntity } from "./order-item.entity.js";
import { OrderLines } from "./order-lines.value-object.js";
import { OrderSource } from "./order-source.enum.js";
import { OrderStatus } from "./order-status.enum.js";
import { OrderDraftedDomainEvent } from "./events/order-drafted.domain-event.js";
import { OrderPlacedDomainEvent } from "./events/order-placed.domain-event.js";
import { OrderCancelledDomainEvent } from "./events/order-cancelled.domain-event.js";
import { OrderCompletedDomainEvent } from "./events/order-completed.domain-event.js";
import { GoodAssignedToOrderDomainEvent } from "./events/good-assigned-to-order.domain-event.js";
import { StockEntryAssignedToOrderDomainEvent } from "./events/stock-entry-assigned-to-order.domain-event.js";
import { OrderInProgressDomainEvent } from "./events/order-in-progress.domain-event.js";
import {
    CannotAssignStockEntryError,
    CannotChangeQuantityOfPlacedOrderError,
    OrderCannotBeCancelledError,
    OrderCannotBeCompletedError,
    OrderCannotBePlacedError,
    OrderHasOrderLinesWithoutItems,
    OrderIsNotEditableError,
    OrderLineHasNoGoodError,
    OrderLineNotFoundError,
} from "./order.errors.js";

const customerId = randomUUID();
const actorId = randomUUID();
const pln = new Currency("PLN");

function createProduct(price = 10): OrderItemEntity {
    return OrderItemEntity.create({
        id: generateEntityId(),
        properties: { price: new Money(new Decimal(price), pln) },
    });
}

function createOrderLines(...products: OrderItemEntity[]): OrderLines {
    let lines = new OrderLines();
    for (const product of products) {
        lines = lines.addProduct(product, 1);
    }
    return lines;
}

function draftOrder(products?: OrderItemEntity[]): OrderAggregate {
    const items = products ?? [createProduct()];
    return OrderAggregate.draft({
        customerId,
        actorId,
        source: OrderSource.SR,
        orderLines: createOrderLines(...items),
    });
}

// ── draft ────────────────────────────────────────────────────

describe("OrderAggregate.draft()", () => {
    it("creates an order in DRAFTED status", () => {
        const order = draftOrder();

        expect(order.properties.status).toBe(OrderStatus.DRAFTED);
    });

    it("preserves actorId and source", () => {
        const order = draftOrder();

        expect(order.actorId).toBe(actorId);
        expect(order.source).toBe(OrderSource.SR);
    });

    it("computes cost from order lines", () => {
        const product = createProduct(25);
        const order = draftOrder([product]);

        expect(order.cost.amount.toNumber()).toBe(25);
    });

    it("emits OrderDraftedDomainEvent", () => {
        const order = draftOrder();

        expect(order.domainEvents).toHaveLength(1);
        expect(order.domainEvents[0]).toBeInstanceOf(OrderDraftedDomainEvent);
    });

    it("throws when order has no lines", () => {
        expect(() =>
            OrderAggregate.draft({
                customerId,
                actorId,
                source: OrderSource.SR,
                orderLines: new OrderLines(),
            }),
        ).toThrow(OrderHasOrderLinesWithoutItems);
    });
});

// ── place ────────────────────────────────────────────────────

describe("OrderAggregate.place()", () => {
    it("transitions DRAFTED → PLACED", () => {
        const order = draftOrder();

        order.place();

        expect(order.properties.status).toBe(OrderStatus.PLACED);
    });

    it("emits OrderPlacedDomainEvent", () => {
        const order = draftOrder();
        order.clearEvents();

        order.place();

        expect(order.domainEvents).toHaveLength(1);
        expect(order.domainEvents[0]).toBeInstanceOf(OrderPlacedDomainEvent);
    });

    it("throws when already PLACED", () => {
        const order = draftOrder();
        order.place();

        expect(() => order.place()).toThrow(OrderCannotBePlacedError);
    });

    it("throws when CANCELLED", () => {
        const order = draftOrder();
        order.cancel();

        expect(() => order.place()).toThrow(OrderCannotBePlacedError);
    });

    it("throws when COMPLETED", () => {
        const order = draftOrder();
        order.place();
        order.complete();

        expect(() => order.place()).toThrow(OrderCannotBePlacedError);
    });
});

// ── cancel ───────────────────────────────────────────────────

describe("OrderAggregate.cancel()", () => {
    it("transitions DRAFTED → CANCELLED", () => {
        const order = draftOrder();

        order.cancel();

        expect(order.properties.status).toBe(OrderStatus.CANCELLED);
    });

    it("transitions PLACED → CANCELLED", () => {
        const order = draftOrder();
        order.place();

        order.cancel();

        expect(order.properties.status).toBe(OrderStatus.CANCELLED);
    });

    it("emits OrderCancelledDomainEvent", () => {
        const order = draftOrder();
        order.clearEvents();

        order.cancel();

        expect(order.domainEvents).toHaveLength(1);
        expect(order.domainEvents[0]).toBeInstanceOf(OrderCancelledDomainEvent);
    });

    it("throws when already CANCELLED", () => {
        const order = draftOrder();
        order.cancel();

        expect(() => order.cancel()).toThrow(OrderCannotBeCancelledError);
    });

    it("throws when COMPLETED", () => {
        const order = draftOrder();
        order.place();
        order.complete();

        expect(() => order.cancel()).toThrow(OrderCannotBeCancelledError);
    });
});

// ── complete ─────────────────────────────────────────────────

describe("OrderAggregate.complete()", () => {
    it("transitions PLACED → COMPLETED", () => {
        const order = draftOrder();
        order.place();

        order.complete();

        expect(order.properties.status).toBe(OrderStatus.COMPLETED);
    });

    it("emits OrderCompletedDomainEvent", () => {
        const order = draftOrder();
        order.place();
        order.clearEvents();

        order.complete();

        expect(order.domainEvents).toHaveLength(1);
        expect(order.domainEvents[0]).toBeInstanceOf(OrderCompletedDomainEvent);
    });

    it("throws when DRAFTED (must be placed first)", () => {
        const order = draftOrder();

        expect(() => order.complete()).toThrow(OrderCannotBeCompletedError);
    });

    it("throws when CANCELLED", () => {
        const order = draftOrder();
        order.cancel();

        expect(() => order.complete()).toThrow(OrderCannotBeCompletedError);
    });

    it("throws when already COMPLETED", () => {
        const order = draftOrder();
        order.place();
        order.complete();

        expect(() => order.complete()).toThrow(OrderCannotBeCompletedError);
    });
});

// ── line modification guards ─────────────────────────────────

describe("OrderAggregate line modification guards", () => {
    it("allows adding products when DRAFTED", () => {
        const order = draftOrder();
        const newProduct = createProduct(5);

        order.addProduct(newProduct, 2);

        expect(order.getOrderLines().getLines().size).toBe(2);
    });

    it("throws when adding products to PLACED order", () => {
        const order = draftOrder();
        order.place();

        expect(() => order.addProduct(createProduct(), 1)).toThrow(CannotChangeQuantityOfPlacedOrderError);
    });

    it("throws when changing quantity on PLACED order", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.place();

        expect(() => order.changeProductQuantity(product, 5)).toThrow(CannotChangeQuantityOfPlacedOrderError);
    });

    it("throws when removing product from PLACED order", () => {
        const productA = createProduct();
        const productB = createProduct();
        const order = draftOrder([productA, productB]);
        order.place();

        expect(() => order.removeProduct(productA)).toThrow(CannotChangeQuantityOfPlacedOrderError);
    });
});

// ── assignGood ─────────────────────────────────────────

describe("OrderAggregate.assignGood()", () => {
    it("assigns a good to an order line when DRAFTED", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        const goodId = randomUUID();

        order.assignGood(product.id as string, goodId);

        const line = order.getOrderLines().getLines().get(product.id);
        expect(line?.goodId).toBe(goodId);
    });

    it("assigns a good to an order line when PLACED", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.place();
        const goodId = randomUUID();

        order.assignGood(product.id as string, goodId);

        const line = order.getOrderLines().getLines().get(product.id);
        expect(line?.goodId).toBe(goodId);
    });

    it("emits GoodAssignedToOrderDomainEvent", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.clearEvents();
        const goodId = randomUUID();

        order.assignGood(product.id as string, goodId);

        expect(order.domainEvents).toHaveLength(1);
        expect(order.domainEvents[0]).toBeInstanceOf(GoodAssignedToOrderDomainEvent);
    });

    it("throws when order is CANCELLED", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.cancel();

        expect(() => order.assignGood(product.id as string, randomUUID())).toThrow(OrderIsNotEditableError);
    });

    it("throws when order is COMPLETED", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.place();
        order.complete();

        expect(() => order.assignGood(product.id as string, randomUUID())).toThrow(OrderIsNotEditableError);
    });

    it("throws when product is not in order", () => {
        const order = draftOrder();
        const nonExistentProductId = randomUUID();

        expect(() => order.assignGood(nonExistentProductId, randomUUID())).toThrow(OrderLineNotFoundError);
    });
});

// ── assignStockEntry + IN_PROGRESS ───────────────────────

describe("OrderAggregate.assignStockEntry()", () => {
    function placedOrderWithGood(product: OrderItemEntity): OrderAggregate {
        const order = draftOrder([product]);
        order.place();
        order.assignGood(product.id as string, randomUUID());
        order.clearEvents();
        return order;
    }

    it("assigns a stock entry to a PLACED order line with a good", () => {
        const product = createProduct();
        const order = placedOrderWithGood(product);
        const stockEntryId = randomUUID();

        order.assignStockEntry(product.id as string, stockEntryId);

        const line = order.getOrderLines().getLines().get(product.id);
        expect(line?.stockEntryId).toBe(stockEntryId);
    });

    it("emits StockEntryAssignedToOrderDomainEvent", () => {
        const product = createProduct();
        const order = placedOrderWithGood(product);

        order.assignStockEntry(product.id as string, randomUUID());

        expect(order.domainEvents[0]).toBeInstanceOf(StockEntryAssignedToOrderDomainEvent);
    });

    it("auto-transitions to IN_PROGRESS when all lines have stock entries", () => {
        const product = createProduct();
        const order = placedOrderWithGood(product);

        order.assignStockEntry(product.id as string, randomUUID());

        expect(order.properties.status).toBe(OrderStatus.IN_PROGRESS);
    });

    it("emits OrderInProgressDomainEvent on auto-transition", () => {
        const product = createProduct();
        const order = placedOrderWithGood(product);

        order.assignStockEntry(product.id as string, randomUUID());

        expect(order.domainEvents).toHaveLength(2);
        expect(order.domainEvents[1]).toBeInstanceOf(OrderInProgressDomainEvent);
    });

    it("transitions to IN_PROGRESS on first stock entry even if not all lines have one", () => {
        const productA = createProduct();
        const productB = createProduct();
        const order = draftOrder([productA, productB]);
        order.place();
        order.assignGood(productA.id as string, randomUUID());
        order.assignGood(productB.id as string, randomUUID());
        order.clearEvents();

        order.assignStockEntry(productA.id as string, randomUUID());

        expect(order.properties.status).toBe(OrderStatus.IN_PROGRESS);
    });

    it("throws when order is DRAFTED", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.assignGood(product.id as string, randomUUID());

        expect(() => order.assignStockEntry(product.id as string, randomUUID())).toThrow(CannotAssignStockEntryError);
    });

    it("throws when order line has no good assigned", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.place();

        expect(() => order.assignStockEntry(product.id as string, randomUUID())).toThrow(OrderLineHasNoGoodError);
    });

    it("throws when order is CANCELLED", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.cancel();

        expect(() => order.assignStockEntry(product.id as string, randomUUID())).toThrow(CannotAssignStockEntryError);
    });
});

// ── IN_PROGRESS cancel guard ─────────────────────────────

describe("IN_PROGRESS order", () => {
    it("cannot be cancelled", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.place();
        order.assignGood(product.id as string, randomUUID());
        order.assignStockEntry(product.id as string, randomUUID());

        expect(order.properties.status).toBe(OrderStatus.IN_PROGRESS);
        expect(() => order.cancel()).toThrow(OrderCannotBeCancelledError);
    });

    it("can be completed", () => {
        const product = createProduct();
        const order = draftOrder([product]);
        order.place();
        order.assignGood(product.id as string, randomUUID());
        order.assignStockEntry(product.id as string, randomUUID());

        order.complete();

        expect(order.properties.status).toBe(OrderStatus.COMPLETED);
    });
});
