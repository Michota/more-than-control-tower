import Decimal from "decimal.js";
import { randomUUID } from "crypto";
import { GetOrderQueryHandler } from "./get-order.query-handler.js";
import { GetOrderQuery } from "./get-order.query.js";
import { OrderNotFoundError } from "../../domain/order.errors.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { OrderStatus } from "../../domain/order-status.enum.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";

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
    };

    const handler = new GetOrderQueryHandler(orderRepo as OrderRepositoryPort);

    return { handler, orderRepo, order };
}

describe("GetOrderQueryHandler", () => {
    it("returns order response with all fields", async () => {
        const order = createDraftOrder();
        const { handler } = createMocks(order);

        const result = await handler.execute(new GetOrderQuery(order.id as string));

        expect(result.id).toBe(order.id as string);
        expect(result.customerId).toBe(order.properties.customerId);
        expect(result.actorId).toBe(order.properties.actorId);
        expect(result.source).toBe(OrderSource.SR);
        expect(result.status).toBe(OrderStatus.DRAFTED);
        expect(result.cost).toBe(10);
        expect(result.currency).toBe("PLN");
        expect(result.orderLines).toHaveLength(1);
        expect(result.orderLines[0]).toMatchObject({
            quantity: 1,
        });
    });

    it("throws OrderNotFoundError when order does not exist", async () => {
        const { handler } = createMocks(null);

        await expect(handler.execute(new GetOrderQuery(randomUUID()))).rejects.toThrow(OrderNotFoundError);
    });
});
