import { Except } from "type-fest";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { Money } from "../../../shared/value-objects/money.js";
import { OrderItemEntity } from "./order-item.entity.js";
import { OrderDraftedDomainEvent } from "./events/order-drafted.domain-event.js";
import { OrderLines } from "./order-lines.value-object.js";
import { OrderStatus } from "./order-status.enum.js";
import { CannotChangeQuantityOfPlacedOrderError, OrderHasOrderLinesWithoutItems } from "./order.errors.js";

interface OrderProperties {
    cost: Money;
    status: OrderStatus;
    orderLines: OrderLines;
    customerId: string;
}

type DraftedOrderProperties = Except<OrderProperties, "status" | "cost">;

export class OrderAggregate extends AggregateRoot<OrderProperties> {
    /**
     * It's not `create`, because we want to enforce that an order must be created as a draft, which means it cannot have different status than draft.
     * This way we can ensure that an order is always created with the same initial state,
     * and we can enforce that an order must have at least one order line before it can be considered as a valid order.
     */
    static draft(properties: DraftedOrderProperties): OrderAggregate {
        const orderDraft = new OrderAggregate({
            properties: {
                customerId: properties.customerId,
                status: OrderStatus.DRAFTED,
                orderLines: properties.orderLines,
                cost: properties.orderLines.getTotalPrice(),
            },
        });

        orderDraft.validate();

        orderDraft.addEvent(
            new OrderDraftedDomainEvent({
                aggregateId: orderDraft.id,
                customerId: properties.customerId,
                orderLines: properties.orderLines,
            }),
        );

        return orderDraft;
    }

    static reconstitute(props: EntityProps<OrderProperties>): OrderAggregate {
        return new OrderAggregate(props);
    }

    validate(): void {
        if (!this.properties.orderLines.hasItems()) {
            throw new OrderHasOrderLinesWithoutItems();
        }
    }

    get cost(): Money {
        return this.properties.cost;
    }

    getOrderLines(): OrderLines {
        return this.properties.orderLines;
    }

    addProduct(product: OrderItemEntity, quantity: number): void {
        if (this.properties.status !== OrderStatus.DRAFTED) {
            throw new CannotChangeQuantityOfPlacedOrderError();
        }
        this.properties.orderLines = this.properties.orderLines.addProduct(product, quantity);
        this.properties.cost = this.properties.orderLines.getTotalPrice();
    }

    changeProductQuantity(product: OrderItemEntity, quantity: number): void {
        if (this.properties.status !== OrderStatus.DRAFTED) {
            throw new CannotChangeQuantityOfPlacedOrderError();
        }
        this.properties.orderLines = this.properties.orderLines.changeQuantityOfProduct(product, quantity);
        this.properties.cost = this.properties.orderLines.getTotalPrice();
    }

    removeProduct(product: OrderItemEntity): void {
        if (this.properties.status !== OrderStatus.DRAFTED) {
            throw new CannotChangeQuantityOfPlacedOrderError();
        }
        this.properties.orderLines = this.properties.orderLines.removeProduct(product);
        this.properties.cost = this.properties.orderLines.getTotalPrice();
    }
}
