import { UUID } from "crypto";
import { Money } from "../../../shared/value-objects/money.js";
import { Product } from "../../../shared/value-objects/product.js";
import { OrderLine } from "./order-line.js";
import { ProductId } from "../../../shared/value-objects/product-id.js";

type Lines = Map<ProductId["value"], OrderLine>;

export class OrderLines {
    private readonly items: Lines;

    private createLinesMap(lines: Lines): Lines {
        return new Map(lines);
    }

    constructor(lines?: Lines) {
        this.items = new Map<UUID, OrderLine>(lines);
    }

    addProduct(product: Product, quantity: number): OrderLines {
        const key = product.productId.value;
        const existing = this.items.get(key);
        const newQuantity = existing ? existing.quantity + quantity : quantity;
        const updated = this.createLinesMap(this.items);
        updated.set(key, new OrderLine(product, newQuantity));
        return new OrderLines(updated);
    }

    changeQuantityOfProduct(product: Product, quantity: number): OrderLines {
        const key = product.productId.value;
        const updated = this.createLinesMap(this.items);
        if (quantity <= 0) {
            updated.delete(key);
        } else {
            updated.set(key, new OrderLine(product, quantity));
        }
        return new OrderLines(updated);
    }

    removeProduct(product: Product): OrderLines {
        return this.changeQuantityOfProduct(product, 0);
    }

    getTotalPrice(): Money {
        const entries = [...this.items.values()];
        if (entries.length === 0) {
            return Money.ZERO;
        }
        return entries.reduce(
            (acc, line) => acc.add(line.subtotal),
            new Money(entries[0].subtotal.amount.mul(0), entries[0].subtotal.currency),
        );
    }

    isEmpty(): boolean {
        return this.items.size === 0;
    }

    getLines(): ReadonlyMap<UUID, OrderLine> {
        return this.items;
    }
}
