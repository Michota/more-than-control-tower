/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/unbound-method */
import Decimal from "decimal.js";
import { randomUUID } from "crypto";
import { DraftOrderCommandHandler } from "./draft-order.command-handler.js";
import { DraftOrderCommand } from "./draft-order.command.js";
import { OrderSource } from "../../domain/order-source.enum.js";
import { CustomerNotFoundForOrderError, PriceNotFoundForOrderLineError } from "../../domain/order.errors.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import type { ItemPriceRepositoryPort } from "../../database/item-price.repository.port.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";

function createMocks() {
    const orderRepo: Partial<OrderRepositoryPort> = {
        save: vi.fn().mockResolvedValue(undefined),
    };

    const itemPriceRepo: Partial<ItemPriceRepositoryPort> = {
        findById: vi.fn().mockResolvedValue({ id: randomUUID(), amount: new Decimal("10"), currency: "PLN" }),
        findActiveByItemAndType: vi.fn().mockResolvedValue(null),
    };

    const uow: UnitOfWorkPort = { commit: vi.fn().mockResolvedValue(undefined) };
    const queryBus = { execute: vi.fn().mockResolvedValue({ id: randomUUID(), name: "Customer" }) };
    const eventBus = { publishAll: vi.fn() };

    const handler = new DraftOrderCommandHandler(
        orderRepo as OrderRepositoryPort,
        itemPriceRepo as ItemPriceRepositoryPort,
        uow,
        queryBus as any,
        eventBus as any,
    );

    return { handler, orderRepo, itemPriceRepo, uow, queryBus, eventBus };
}

describe("DraftOrderCommandHandler", () => {
    it("creates an order and returns its ID", async () => {
        const { handler, orderRepo, uow, eventBus } = createMocks();

        const result = await handler.execute(
            new DraftOrderCommand({
                customerId: randomUUID(),
                actorId: randomUUID(),
                source: OrderSource.SR,
                lines: [{ itemId: randomUUID(), quantity: 2, priceId: randomUUID() }],
                currency: "PLN",
            }),
        );

        expect(result).toBeDefined();
        expect(orderRepo.save).toHaveBeenCalledOnce();
        expect(uow.commit).toHaveBeenCalledOnce();
        expect(eventBus.publishAll).toHaveBeenCalledOnce();
    });

    it("throws CustomerNotFoundForOrderError when customer does not exist", async () => {
        const { handler, queryBus } = createMocks();
        queryBus.execute.mockResolvedValue(null);

        await expect(
            handler.execute(
                new DraftOrderCommand({
                    customerId: randomUUID(),
                    actorId: randomUUID(),
                    source: OrderSource.SR,
                    lines: [{ itemId: randomUUID(), quantity: 1, priceId: randomUUID() }],
                    currency: "PLN",
                }),
            ),
        ).rejects.toThrow(CustomerNotFoundForOrderError);
    });

    it("throws PriceNotFoundForOrderLineError when price is not resolved", async () => {
        const { handler, itemPriceRepo } = createMocks();
        (itemPriceRepo.findById as any).mockResolvedValue(null);

        await expect(
            handler.execute(
                new DraftOrderCommand({
                    customerId: randomUUID(),
                    actorId: randomUUID(),
                    source: OrderSource.SR,
                    lines: [{ itemId: randomUUID(), quantity: 1, priceId: randomUUID() }],
                    currency: "PLN",
                }),
            ),
        ).rejects.toThrow(PriceNotFoundForOrderLineError);
    });
});
