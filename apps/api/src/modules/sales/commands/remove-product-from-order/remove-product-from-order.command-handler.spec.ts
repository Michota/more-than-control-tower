/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import { Decimal } from "decimal.js";
import { randomUUID } from "crypto";
import { describe, it, expect, vi } from "vitest";
import { RemoveProductFromOrderCommandHandler } from "./remove-product-from-order.command-handler.js";
import { RemoveProductFromOrderCommand } from "./remove-product-from-order.command.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { OrderNotFoundError } from "../../domain/order.errors.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import type { ItemPriceRepositoryPort } from "../../database/item-price.repository.port.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";

const itemId = randomUUID();
const secondItemId = randomUUID();
const priceId = randomUUID();

function createProduct(id = itemId): OrderItemEntity {
    return OrderItemEntity.create({
        id: generateEntityId(id),
        properties: { price: new Money(new Decimal("10"), new Currency("PLN")) },
    });
}

function createDraftOrderWithTwoProducts(): OrderAggregate {
    return OrderAggregate.draft({
        customerId: randomUUID(),
        actorId: randomUUID(),
        source: OrderSource.SR,
        orderLines: new OrderLines().addProduct(createProduct(itemId), 1).addProduct(createProduct(secondItemId), 2),
    });
}

function createMocks(order: OrderAggregate | null = createDraftOrderWithTwoProducts()) {
    const orderRepo: Partial<OrderRepositoryPort> = {
        findOneById: vi.fn().mockResolvedValue(order),
        save: vi.fn().mockResolvedValue(undefined),
    };
    const itemPriceRepo: Partial<ItemPriceRepositoryPort> = {
        findById: vi.fn().mockResolvedValue({ id: priceId, amount: new Decimal("10"), currency: "PLN" }),
    };
    const uow: UnitOfWorkPort = { commit: vi.fn().mockResolvedValue(undefined) };
    const eventBus = { publishAll: vi.fn() };

    const handler = new RemoveProductFromOrderCommandHandler(
        orderRepo as OrderRepositoryPort,
        itemPriceRepo as ItemPriceRepositoryPort,
        uow,
        eventBus as any,
    );

    return { handler, orderRepo, itemPriceRepo, uow, eventBus };
}

describe("RemoveProductFromOrderCommandHandler", () => {
    it("removes product and persists", async () => {
        const order = createDraftOrderWithTwoProducts();
        const { handler, orderRepo, uow, eventBus } = createMocks(order);

        const command = new RemoveProductFromOrderCommand({
            orderId: order.id,
            itemId,
            priceId,
        });

        await handler.execute(command);

        expect(orderRepo.save).toHaveBeenCalledWith(order);
        expect(uow.commit).toHaveBeenCalled();
        expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it("throws OrderNotFoundError when order doesn't exist", async () => {
        const { handler } = createMocks(null);

        const command = new RemoveProductFromOrderCommand({
            orderId: randomUUID(),
            itemId: randomUUID(),
            priceId,
        });

        await expect(handler.execute(command)).rejects.toThrow(OrderNotFoundError);
    });
});
