import Decimal from "decimal.js";
import { randomUUID } from "crypto";
import { GetCustomerOrdersQueryHandler } from "./get-customer-orders.query-handler.js";
import { GetCustomerOrdersQuery } from "../../../../shared/queries/get-customer-orders.query.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";

function createDraftOrder(customerId: string): OrderAggregate {
    const product = OrderItemEntity.create({
        id: generateEntityId(),
        properties: { price: new Money(new Decimal("10"), new Currency("PLN")) },
    });
    return OrderAggregate.draft({
        customerId,
        actorId: randomUUID(),
        source: OrderSource.SR,
        orderLines: new OrderLines().addProduct(product, 1),
    });
}

function createMocks(orders: OrderAggregate[] = []) {
    const orderRepo: Partial<OrderRepositoryPort> = {
        findByCustomerId: vi.fn().mockResolvedValue(orders),
    };

    const handler = new GetCustomerOrdersQueryHandler(orderRepo as OrderRepositoryPort);

    return { handler, orderRepo };
}

describe("GetCustomerOrdersQueryHandler", () => {
    it("returns customer orders", async () => {
        const customerId = randomUUID();
        const order = createDraftOrder(customerId);
        const { handler } = createMocks([order]);

        const result = await handler.execute(new GetCustomerOrdersQuery(customerId));

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            id: order.id as string,
            status: "DRAFTED",
            totalCost: 10,
            currency: "PLN",
        });
        expect(result[0].orderedAt).toBeDefined();
    });

    it("returns empty array when no orders", async () => {
        const { handler } = createMocks([]);

        const result = await handler.execute(new GetCustomerOrdersQuery(randomUUID()));

        expect(result).toEqual([]);
    });
});
