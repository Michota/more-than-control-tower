/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import { Decimal } from "decimal.js";
import { randomUUID } from "crypto";
import { AssignStockEntryCommandHandler } from "./assign-stock-entry.command-handler.js";
import { AssignStockEntryCommand } from "./assign-stock-entry.command.js";
import {
    OrderNotFoundError,
    StockEntryAlreadyAssignedError,
    StockEntryNotFoundForAssignmentError,
} from "../../domain/order.errors.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import type { StockEntryResponse } from "../../../../shared/queries/get-stock-entry.query.js";

function createPlacedOrderWithGood(): { order: OrderAggregate; productId: string; goodId: string } {
    const productId = generateEntityId();
    const goodId = randomUUID();
    const product = OrderItemEntity.create({
        id: productId,
        properties: { price: new Money(new Decimal("10"), new Currency("PLN")) },
    });
    const order = OrderAggregate.draft({
        customerId: randomUUID(),
        actorId: randomUUID(),
        source: OrderSource.SR,
        orderLines: new OrderLines().addProduct(product, 1),
    });
    order.assignGood(productId as string, goodId);
    order.place();
    order.clearEvents();
    return { order, productId: productId as string, goodId };
}

function createMocks(
    order: OrderAggregate | null,
    stockEntry: StockEntryResponse | null,
    isStockEntryAssigned = false,
) {
    const orderRepo: Partial<OrderRepositoryPort> = {
        findOneById: vi.fn().mockResolvedValue(order),
        save: vi.fn().mockResolvedValue(undefined),
        isStockEntryAssigned: vi.fn().mockResolvedValue(isStockEntryAssigned),
    };
    const uow: UnitOfWorkPort = { commit: vi.fn().mockResolvedValue(undefined) };
    const queryBus = { execute: vi.fn().mockResolvedValue(stockEntry) };
    const eventBus = { publishAll: vi.fn() };

    const handler = new AssignStockEntryCommandHandler(
        orderRepo as OrderRepositoryPort,
        uow,
        queryBus as any,
        eventBus as any,
    );

    return { handler, orderRepo, uow, queryBus, eventBus };
}

describe("AssignStockEntryCommandHandler", () => {
    it("assigns stock entry and persists", async () => {
        const { order, productId, goodId } = createPlacedOrderWithGood();
        const stockEntryId = randomUUID();
        const stockEntry: StockEntryResponse = {
            id: stockEntryId,
            goodId,
            warehouseId: randomUUID(),
            quantity: 5,
        };
        const { handler, orderRepo, uow, eventBus } = createMocks(order, stockEntry);

        await handler.execute(
            new AssignStockEntryCommand({
                orderId: order.id as string,
                productId,
                stockEntryId,
            }),
        );

        expect(orderRepo.save).toHaveBeenCalledOnce();

        expect(uow.commit).toHaveBeenCalledOnce();
        expect(eventBus.publishAll).toHaveBeenCalledOnce();
    });

    it("throws OrderNotFoundError when order does not exist", async () => {
        const { handler } = createMocks(null, null);

        await expect(
            handler.execute(
                new AssignStockEntryCommand({
                    orderId: randomUUID(),
                    productId: randomUUID(),
                    stockEntryId: randomUUID(),
                }),
            ),
        ).rejects.toThrow(OrderNotFoundError);
    });

    it("throws StockEntryNotFoundForAssignmentError when stock entry does not exist", async () => {
        const { order, productId } = createPlacedOrderWithGood();
        const { handler } = createMocks(order, null);

        await expect(
            handler.execute(
                new AssignStockEntryCommand({
                    orderId: order.id as string,
                    productId,
                    stockEntryId: randomUUID(),
                }),
            ),
        ).rejects.toThrow(StockEntryNotFoundForAssignmentError);
    });

    it("throws StockEntryAlreadyAssignedError when stock entry is already assigned", async () => {
        const { order, productId, goodId } = createPlacedOrderWithGood();
        const stockEntryId = randomUUID();
        const stockEntry: StockEntryResponse = {
            id: stockEntryId,
            goodId,
            warehouseId: randomUUID(),
            quantity: 5,
        };
        const { handler } = createMocks(order, stockEntry, true);

        await expect(
            handler.execute(
                new AssignStockEntryCommand({
                    orderId: order.id as string,
                    productId,
                    stockEntryId,
                }),
            ),
        ).rejects.toThrow(StockEntryAlreadyAssignedError);
    });
});
