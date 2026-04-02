import { Decimal } from "decimal.js";
import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderLines } from "../../domain/order-lines.value-object.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { CustomerNotFoundForOrderError, PriceNotFoundForOrderLineError } from "../../domain/order.errors.js";
import { GetCustomerQuery, type GetCustomerResponse } from "../../../../shared/queries/get-customer.query.js";
import type { ItemPriceRepositoryPort } from "../../database/item-price.repository.port.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ITEM_PRICE_REPOSITORY_PORT, ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";
import { DraftOrderCommand, DraftOrderLine } from "./draft-order.command.js";

@CommandHandler(DraftOrderCommand)
export class DraftOrderCommandHandler implements ICommandHandler<DraftOrderCommand> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,

        @Inject(ITEM_PRICE_REPOSITORY_PORT)
        private readonly itemPriceRepo: ItemPriceRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly queryBus: QueryBus,
        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: DraftOrderCommand): Promise<IdOfEntity<OrderAggregate>> {
        const customer: GetCustomerResponse | null = await this.queryBus.execute(new GetCustomerQuery(cmd.customerId));

        if (!customer) {
            throw new CustomerNotFoundForOrderError(cmd.customerId);
        }

        const orderLines = await this.resolveOrderLines(cmd.lines, cmd.buyerPriceTypeId);
        const order = OrderAggregate.draft({
            customerId: cmd.customerId,
            actorId: cmd.actorId,
            source: cmd.source,
            orderLines,
        });

        await this.orderRepo.save(order);
        await this.uow.commit();

        this.eventBus.publishAll(order.domainEvents);
        order.clearEvents();

        return order.id;
    }

    private async resolveOrderLines(lines: DraftOrderLine[], buyerPriceTypeId?: string): Promise<OrderLines> {
        const resolved = await Promise.all(
            lines.map(async (line) => {
                const priceRecord = line.priceId
                    ? await this.itemPriceRepo.findById(line.priceId)
                    : buyerPriceTypeId
                      ? await this.itemPriceRepo.findActiveByItemAndType(line.itemId, buyerPriceTypeId)
                      : null;

                if (!priceRecord) {
                    throw new PriceNotFoundForOrderLineError(line.itemId);
                }

                return { line, priceRecord };
            }),
        );

        return resolved.reduce((orderLines, { line, priceRecord }) => {
            const price = new Money(new Decimal(priceRecord.amount.toString()), new Currency(priceRecord.currency));
            const orderItem = OrderItemEntity.create({
                id: generateEntityId(line.itemId),
                properties: { price },
            });

            return orderLines.addProduct(orderItem, line.quantity);
        }, new OrderLines());
    }
}
