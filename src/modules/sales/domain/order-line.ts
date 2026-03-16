import { Product } from '../../../shared/domain/value-objects/product.js';
import { Money } from '../../../shared/domain/value-objects/money.js';

export class OrderLine {
    constructor(
        readonly product: Product,
        readonly quantity: number,
    ) {}

    get subtotal(): Money {
        return new Money(this.product.price.amount.mul(this.quantity), this.product.price.currency);
    }

    withQuantity(quantity: number): OrderLine {
        return new OrderLine(this.product, quantity);
    }
}
