import Decimal from "decimal.js";
import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { generateEntityId } from "../../../../libs/ddd/utils/randomize-entity-id.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { Currency } from "../../../../shared/value-objects/currency.js";
import { Money } from "../../../../shared/value-objects/money.js";
import { OrderItemEntity } from "../../domain/order-item.entity.js";
import { OrderNotFoundError, PriceNotFoundForOrderLineError } from "../../domain/order.errors.js";
import type { ItemPriceRepositoryPort } from "../../database/item-price.repository.port.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ITEM_PRICE_REPOSITORY_PORT, ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";
import { AddProductToOrderCommand } from "./add-product-to-order.command.js";

@CommandHandler(AddProductToOrderCommand)
export class AddProductToOrderCommandHandler implements ICommandHandler<AddProductToOrderCommand> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,

        @Inject(ITEM_PRICE_REPOSITORY_PORT)
        private readonly itemPriceRepo: ItemPriceRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: AddProductToOrderCommand): Promise<void> {
        const order = await this.orderRepo.findOneById(cmd.orderId);

        if (!order) {
            throw new OrderNotFoundError(cmd.orderId);
        }

        const priceRecord = cmd.priceId
            ? await this.itemPriceRepo.findById(cmd.priceId)
            : cmd.buyerPriceTypeId
              ? await this.itemPriceRepo.findActiveByItemAndType(cmd.itemId, cmd.buyerPriceTypeId)
              : null;

        if (!priceRecord) {
            throw new PriceNotFoundForOrderLineError(cmd.itemId);
        }

        const price = new Money(new Decimal(priceRecord.amount.toString()), new Currency(priceRecord.currency));
        const orderItem = OrderItemEntity.create({
            id: generateEntityId(cmd.itemId),
            properties: { price },
        });

        order.addProduct(orderItem, cmd.quantity);

        await this.orderRepo.save(order);
        await this.uow.commit();

        this.eventBus.publishAll(order.domainEvents);
        order.clearEvents();
    }
}
