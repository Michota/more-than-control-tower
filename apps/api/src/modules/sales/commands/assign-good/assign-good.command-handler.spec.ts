/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import { Decimal } from "decimal.js";
import { randomUUID } from "crypto";
import { AssignGoodCommandHandler } from "./assign-good.command-handler.js";
import { AssignGoodCommand } from "./assign-good.command.js";
import { GoodNotFoundForAssignmentError, OrderNotFoundError } from "../../domain/order.errors.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";

function createDraftOrder(): { order: OrderAggregate; productId: string } {
    const productId = generateEntityId();
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
    return { order, productId: productId as string };
}

function createMocks(order: OrderAggregate | null = createDraftOrder().order) {
    const orderRepo: Partial<OrderRepositoryPort> = {
        findOneById: vi.fn().mockResolvedValue(order),
        save: vi.fn().mockResolvedValue(undefined),
    };
    const uow: UnitOfWorkPort = { commit: vi.fn().mockResolvedValue(undefined) };
    const queryBus = { execute: vi.fn().mockResolvedValue(true) };
    const eventBus = { publishAll: vi.fn() };

    const handler = new AssignGoodCommandHandler(
        orderRepo as OrderRepositoryPort,
        uow,
        queryBus as any,
        eventBus as any,
    );

    return { handler, orderRepo, uow, queryBus, eventBus };
}

describe("AssignGoodCommandHandler", () => {
    it("assigns good and persists", async () => {
        const { order, productId } = createDraftOrder();
        const { handler, orderRepo, uow, eventBus } = createMocks(order);
        const goodId = randomUUID();

        await handler.execute(new AssignGoodCommand({ orderId: order.id as string, productId, goodId }));

        expect(orderRepo.save).toHaveBeenCalledOnce();

        expect(uow.commit).toHaveBeenCalledOnce();
        expect(eventBus.publishAll).toHaveBeenCalledOnce();
    });

    it("throws OrderNotFoundError when order does not exist", async () => {
        const { handler } = createMocks(null);

        await expect(
            handler.execute(
                new AssignGoodCommand({
                    orderId: randomUUID(),
                    productId: randomUUID(),
                    goodId: randomUUID(),
                }),
            ),
        ).rejects.toThrow(OrderNotFoundError);
    });

    it("throws GoodNotFoundForAssignmentError when good does not exist", async () => {
        const { order, productId } = createDraftOrder();
        const mocks = createMocks(order);
        mocks.queryBus.execute.mockResolvedValue(false);

        await expect(
            mocks.handler.execute(
                new AssignGoodCommand({
                    orderId: order.id as string,
                    productId,
                    goodId: randomUUID(),
                }),
            ),
        ).rejects.toThrow(GoodNotFoundForAssignmentError);
    });
});
