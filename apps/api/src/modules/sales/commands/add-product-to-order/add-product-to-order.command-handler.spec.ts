/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import Decimal from "decimal.js";
import { randomUUID } from "crypto";
import { describe, it, expect, vi } from "vitest";
import { AddProductToOrderCommandHandler } from "./add-product-to-order.command-handler.js";
import { AddProductToOrderCommand } from "./add-product-to-order.command.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { OrderNotFoundError, PriceNotFoundForOrderLineError } from "../../domain/order.errors.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import type { ItemPriceRepositoryPort } from "../../database/item-price.repository.port.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";

const itemId = randomUUID();
const priceId = randomUUID();

function createProduct(id = itemId): OrderItemEntity {
    return OrderItemEntity.create({
        id: generateEntityId(id),
        properties: { price: new Money(new Decimal("10"), new Currency("PLN")) },
    });
}

function createDraftOrder(): OrderAggregate {
    return OrderAggregate.draft({
        customerId: randomUUID(),
        actorId: randomUUID(),
        source: OrderSource.SR,
        orderLines: new OrderLines().addProduct(createProduct(), 1),
    });
}

function createMocks(order: OrderAggregate | null = createDraftOrder()) {
    const orderRepo: Partial<OrderRepositoryPort> = {
        findOneById: vi.fn().mockResolvedValue(order),
        save: vi.fn().mockResolvedValue(undefined),
    };
    const itemPriceRepo: Partial<ItemPriceRepositoryPort> = {
        findById: vi.fn().mockResolvedValue({ id: priceId, amount: new Decimal("10"), currency: "PLN" }),
    };
    const uow: UnitOfWorkPort = { commit: vi.fn().mockResolvedValue(undefined) };
    const eventBus = { publishAll: vi.fn() };

    const handler = new AddProductToOrderCommandHandler(
        orderRepo as OrderRepositoryPort,
        itemPriceRepo as ItemPriceRepositoryPort,
        uow,
        eventBus as any,
    );

    return { handler, orderRepo, itemPriceRepo, uow, eventBus };
}

describe("AddProductToOrderCommandHandler", () => {
    it("adds product to order and persists", async () => {
        const order = createDraftOrder();
        const { handler, orderRepo, uow, eventBus } = createMocks(order);
        const newItemId = randomUUID();

        const command = new AddProductToOrderCommand({
            orderId: order.id,
            itemId: newItemId,
            quantity: 3,
            priceId,
        });

        await handler.execute(command);

        expect(orderRepo.save).toHaveBeenCalledWith(order);
        expect(uow.commit).toHaveBeenCalled();
        expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it("throws OrderNotFoundError when order doesn't exist", async () => {
        const { handler } = createMocks(null);

        const command = new AddProductToOrderCommand({
            orderId: randomUUID(),
            itemId: randomUUID(),
            quantity: 1,
            priceId,
        });

        await expect(handler.execute(command)).rejects.toThrow(OrderNotFoundError);
    });

    it("throws PriceNotFoundForOrderLineError when price not resolved", async () => {
        const order = createDraftOrder();
        const { handler, itemPriceRepo } = createMocks(order);
        vi.mocked(itemPriceRepo.findById!).mockResolvedValue(null as any);

        const command = new AddProductToOrderCommand({
            orderId: order.id,
            itemId: randomUUID(),
            quantity: 1,
        });

        await expect(handler.execute(command)).rejects.toThrow(PriceNotFoundForOrderLineError);
    });
});
