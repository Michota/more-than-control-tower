import { ValueObject } from "@src/libs/ddd/index.js";
import { Money } from "../../../shared/value-objects/money.js";
import { Product } from "../../../shared/value-objects/product.js";
import { OrderLine } from "./order-line.js";

type ProductId = Product["id"];

type Lines = Map<ProductId, OrderLine>;

interface OrderLinesProperties {
    items: Lines;
}

export class OrderLines extends ValueObject<OrderLinesProperties> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected validate(_: OrderLinesProperties): void {}

    private createLinesMap(lines: Lines): Lines {
        return new Map(lines);
    }

    constructor(items: Lines = new Map()) {
        super({ items });
    }

    addProduct(product: Product, quantity: number): OrderLines {
        const key = product.id;
        const existingOrderLine = this.properties.items.get(key);
        const newQuantity = existingOrderLine ? existingOrderLine.quantity + quantity : quantity;
        const updated = this.createLinesMap(this.properties.items);
        updated.set(key, new OrderLine({ product, quantity: newQuantity }));
        return new OrderLines(updated);
    }

    changeQuantityOfProduct(product: Product, quantity: number): OrderLines {
        const key = product.id;
        const updated = this.createLinesMap(this.properties.items);
        if (quantity <= 0) {
            updated.delete(key);
        } else {
            updated.set(key, new OrderLine({ product, quantity }));
        }
        return new OrderLines(updated);
    }

    removeProduct(product: Product): OrderLines {
        return this.changeQuantityOfProduct(product, 0);
    }

    getTotalPrice(): Money {
        return Money.sum(Array.from(this.properties.items.values()).map((entry) => entry.subtotal));
    }

    hasItems(): boolean {
        return this.properties.items.size !== 0;
    }

    getLines(): ReadonlyMap<ProductId, OrderLine> {
        return this.properties.items;
    }
}
