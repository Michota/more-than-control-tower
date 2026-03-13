import { CustomerId } from '../../../shared/domain/value-objects/customer-id.js';
import { Money } from '../../../shared/domain/value-objects/money.js';
import { OrderLines } from './order-lines.js';
import { OrderStatus } from './order-status.enum.js';
import { OrderId } from './value-objects/order-id.js';

export class Order {
    private constructor(
        readonly orderId: OrderId,
        readonly customerId: CustomerId,
        private orderLines: OrderLines,
        private status: OrderStatus,
        private price: Money,
        readonly createdAt: Date,
    ) {}

    static draft(customerId: CustomerId, orderLines: OrderLines): Order {
        if (orderLines.isEmpty()) {
            throw new Error('Cannot draft an order with no order lines');
        }
        const orderId = new OrderId();
        const price = orderLines.getTotalPrice();
        return new Order(orderId, customerId, orderLines, OrderStatus.DRAFTED, price, new Date());
    }

    static reconstitute(
        orderId: OrderId,
        customerId: CustomerId,
        orderLines: OrderLines,
        status: OrderStatus,
        price: Money,
        createdAt: Date,
    ): Order {
        return new Order(orderId, customerId, orderLines, status, price, createdAt);
    }

    isEditable(): boolean {
        return this.status === OrderStatus.DRAFTED;
    }

    getPrice(): Money {
        if (this.isEditable()) {
            return this.orderLines.getTotalPrice();
        }
        return this.price;
    }

    getStatus(): OrderStatus {
        return this.status;
    }

    getOrderLines(): OrderLines {
        return this.orderLines;
    }

    confirm(): void {
        this.verifyIfStatusCanBeChanged(OrderStatus.CONFIRMED);
        this.price = this.orderLines.getTotalPrice();
        this.status = OrderStatus.CONFIRMED;
    }

    cancel(): void {
        this.verifyIfStatusCanBeChanged(OrderStatus.CANCELLED);
        this.status = OrderStatus.CANCELLED;
    }

    complete(): void {
        this.verifyIfStatusCanBeChanged(OrderStatus.COMPLETED);
        this.status = OrderStatus.COMPLETED;
    }

    private verifyIfStatusCanBeChanged(targetStatus: OrderStatus): void {
        const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
            [OrderStatus.DRAFTED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        };

        const allowedTargets = allowed[this.status];
        if (!allowedTargets || !allowedTargets.includes(targetStatus)) {
            throw new Error(`Cannot transition order from ${this.status} to ${targetStatus}`);
        }
    }
}
