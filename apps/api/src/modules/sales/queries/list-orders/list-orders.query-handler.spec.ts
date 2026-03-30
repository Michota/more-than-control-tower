import Decimal from "decimal.js";
import { randomUUID } from "crypto";
import { ListOrdersQueryHandler } from "./list-orders.query-handler.js";
import { ListOrdersQuery } from "./list-orders.query.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { OrderStatus } from "../../domain/order-status.enum.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { Paginated } from "../../../../libs/ports/repository.port.js";
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

function createMocks(paginatedResult: Paginated<OrderAggregate>) {
    const orderRepo: Partial<OrderRepositoryPort> = {
        findFilteredPaginated: vi.fn().mockResolvedValue(paginatedResult),
    };

    const handler = new ListOrdersQueryHandler(orderRepo as OrderRepositoryPort);

    return { handler, orderRepo };
}

describe("ListOrdersQueryHandler", () => {
    it("returns paginated results", async () => {
        const order = createDraftOrder();
        const paginated = new Paginated({ data: [order], count: 1, limit: 20, page: 1 });
        const { handler } = createMocks(paginated);

        const result = await handler.execute(new ListOrdersQuery(1, 20));

        expect(result.data).toHaveLength(1);
        expect(result.count).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.page).toBe(1);
        expect(result.data[0]).toMatchObject({
            id: order.id as string,
            source: OrderSource.SR,
            status: OrderStatus.DRAFTED,
            cost: 10,
            currency: "PLN",
        });
    });

    it("passes filter params to repository", async () => {
        const paginated = new Paginated<OrderAggregate>({ data: [], count: 0, limit: 10, page: 2 });
        const { handler, orderRepo } = createMocks(paginated);
        const customerId = randomUUID();

        await handler.execute(new ListOrdersQuery(2, 10, customerId, "DRAFTED", "search-term"));

        expect(orderRepo.findFilteredPaginated).toHaveBeenCalledWith({
            page: 2,
            limit: 10,
            customerId,
            status: "DRAFTED",
            search: "search-term",
        });
    });
});
