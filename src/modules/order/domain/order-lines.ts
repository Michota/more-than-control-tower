import { Product } from '../../../shared/domain/value-objects/product.js';
import { Money } from '../../../shared/domain/value-objects/money.js';
import { OrderLine } from './order-line.js';

export class OrderLines {
    private readonly lines: Map<string, OrderLine>;

    constructor(lines?: Map<string, OrderLine>) {
        this.lines = lines ? new Map<string, OrderLine>(lines) : new Map<string, OrderLine>();
    }

    addProduct(product: Product, quantity: number): OrderLines {
        const key = product.productId.value;
        const existing = this.lines.get(key);
        const newQuantity = existing ? existing.quantity + quantity : quantity;
        const updated = new Map<string, OrderLine>(this.lines);
        updated.set(key, new OrderLine(product, newQuantity));
        return new OrderLines(updated);
    }

    changeQuantityOfProduct(product: Product, quantity: number): OrderLines {
        const key = product.productId.value;
        const updated = new Map<string, OrderLine>(this.lines);
        if (quantity <= 0) {
            updated.delete(key);
        } else {
            updated.set(key, new OrderLine(product, quantity));
        }
        return new OrderLines(updated);
    }

    getTotalPrice(): Money {
        const entries = [...this.lines.values()];
        if (entries.length === 0) {
            return Money.ZERO;
        }
        return entries.reduce(
            (acc, line) => acc.add(line.subtotal),
            new Money(entries[0].subtotal.amount.mul(0), entries[0].subtotal.currency),
        );
    }

    isEmpty(): boolean {
        return this.lines.size === 0;
    }

    getLines(): ReadonlyMap<string, OrderLine> {
        return this.lines;
    }
}
