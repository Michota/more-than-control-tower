/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import { Decimal } from "decimal.js";
import { randomUUID } from "crypto";
import { PlaceOrderCommandHandler } from "./place-order.command-handler.js";
import { PlaceOrderCommand } from "./place-order.command.js";
import { OrderNotFoundError } from "../../domain/order.errors.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";

function createDraftOrder(): OrderAggregate {
    const product = OrderItemEntity.create({
        id: generateEntityId(),
        properties: { price: new Money(new Decimal("10"), new Currency("PLN")) },
    });
    return OrderAggregate.draft({
        customerId: randomUUID(),
        actorId: randomUUID(),
        source: OrderSource.SR,
        orderLines: new OrderLines().addProduct(product, 1),
    });
}

function createMocks(order: OrderAggregate | null = createDraftOrder()) {
    const orderRepo: Partial<OrderRepositoryPort> = {
        findOneById: vi.fn().mockResolvedValue(order),
        save: vi.fn().mockResolvedValue(undefined),
    };
    const uow: UnitOfWorkPort = { commit: vi.fn().mockResolvedValue(undefined) };
    const eventBus = { publishAll: vi.fn() };

    const handler = new PlaceOrderCommandHandler(orderRepo as OrderRepositoryPort, uow, eventBus as any);

    return { handler, orderRepo, uow, eventBus };
}

describe("PlaceOrderCommandHandler", () => {
    it("places an order and persists it", async () => {
        const { handler, orderRepo, uow, eventBus } = createMocks();

        await handler.execute(new PlaceOrderCommand({ orderId: randomUUID() }));

        expect(orderRepo.save).toHaveBeenCalledOnce();
        expect(uow.commit).toHaveBeenCalledOnce();
        expect(eventBus.publishAll).toHaveBeenCalledOnce();
    });

    it("throws OrderNotFoundError when order does not exist", async () => {
        const { handler } = createMocks(null);

        await expect(handler.execute(new PlaceOrderCommand({ orderId: randomUUID() }))).rejects.toThrow(
            OrderNotFoundError,
        );
    });
});
