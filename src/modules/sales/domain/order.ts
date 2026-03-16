import { Money } from '../../../shared/domain/value-objects/money.js';
import { Product } from '../../../shared/domain/value-objects/product.js';
import { OrderLines } from './order-lines.js';
import { OrderId } from './value-objects/order-id.js';

export class Order {
    private constructor(
        readonly id: OrderId,
        private orderLines: OrderLines,
        private price: Money,
        readonly createdAt: Date,
    ) {}

    static draft(orderLines: OrderLines): Order {
        if (orderLines.isEmpty()) {
            throw new Error('Cannot draft an order with no order lines');
        }
        return new Order(new OrderId(), orderLines, orderLines.getTotalPrice(), new Date());
    }

    static reconstitute({ id, orderLines, price, createdAt }: Order): Order {
        return new Order(id, orderLines, price, createdAt);
    }

    getPrice(): Money {
        this.price = this.orderLines.getTotalPrice();
        return this.price;
    }

    getOrderLines(): OrderLines {
        return this.orderLines;
    }

    addProduct(product: Product, quantity: number): void {
        this.orderLines = this.orderLines.addProduct(product, quantity);
    }

    changeProductQuantity(product: Product, quantity: number): void {
        this.orderLines = this.orderLines.changeQuantityOfProduct(product, quantity);
    }

    removeProduct(product: Product): void {
        this.orderLines = this.orderLines.removeProduct(product);
    }
}
