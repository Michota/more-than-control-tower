import { Except } from "type-fest";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { Money } from "../../../shared/value-objects/money.js";
import { OrderItemEntity } from "./order-item.entity.js";
import { OrderDraftedDomainEvent } from "./events/order-drafted.domain-event.js";
import { OrderLines } from "./order-lines.value-object.js";
import { OrderSource } from "./order-source.enum.js";
import { OrderStatus } from "./order-status.enum.js";
import { OrderPlacedDomainEvent } from "./events/order-placed.domain-event.js";
import { OrderCancelledDomainEvent } from "./events/order-cancelled.domain-event.js";
import { OrderCompletedDomainEvent } from "./events/order-completed.domain-event.js";
import { GoodAssignedToOrderDomainEvent } from "./events/good-assigned-to-order.domain-event.js";
import {
    CannotChangeQuantityOfPlacedOrderError,
    OrderCannotBeCancelledError,
    OrderCannotBeCompletedError,
    OrderCannotBePlacedError,
    OrderHasOrderLinesWithoutItems,
    OrderIsNotEditableError,
    OrderLineNotFoundError,
} from "./order.errors.js";

export interface OrderProperties {
    cost: Money;
    status: OrderStatus;
    orderLines: OrderLines;
    customerId: string;
    actorId: string;
    source: OrderSource;
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
                actorId: properties.actorId,
                source: properties.source,
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
                actorId: properties.actorId,
                source: properties.source,
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

    get actorId(): string {
        return this.properties.actorId;
    }

    get source(): OrderSource {
        return this.properties.source;
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

    place(): void {
        if (this.properties.status !== OrderStatus.DRAFTED) {
            throw new OrderCannotBePlacedError();
        }

        this.properties.status = OrderStatus.PLACED;

        this.addEvent(
            new OrderPlacedDomainEvent({
                aggregateId: this.id,
                customerId: this.properties.customerId,
            }),
        );
    }

    cancel(): void {
        if (this.properties.status !== OrderStatus.DRAFTED && this.properties.status !== OrderStatus.PLACED) {
            throw new OrderCannotBeCancelledError();
        }

        this.properties.status = OrderStatus.CANCELLED;

        this.addEvent(
            new OrderCancelledDomainEvent({
                aggregateId: this.id,
                customerId: this.properties.customerId,
            }),
        );
    }

    complete(): void {
        if (this.properties.status !== OrderStatus.PLACED) {
            throw new OrderCannotBeCompletedError();
        }

        this.properties.status = OrderStatus.COMPLETED;

        this.addEvent(
            new OrderCompletedDomainEvent({
                aggregateId: this.id,
                customerId: this.properties.customerId,
            }),
        );
    }

    assignGood(productId: string, goodId: string): void {
        if (this.properties.status === OrderStatus.CANCELLED || this.properties.status === OrderStatus.COMPLETED) {
            throw new OrderIsNotEditableError();
        }

        const productEntityId = productId as EntityId;
        const line = this.properties.orderLines.getLines().get(productEntityId);

        if (!line) {
            throw new OrderLineNotFoundError(productId);
        }

        this.properties.orderLines = this.properties.orderLines.assignGood(productEntityId, goodId);

        this.addEvent(
            new GoodAssignedToOrderDomainEvent({
                aggregateId: this.id,
                productId,
                goodId,
            }),
        );
    }
}
