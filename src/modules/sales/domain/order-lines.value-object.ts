import { ValueObject } from "@src/libs/ddd/index.js";
import { Money } from "../../../shared/value-objects/money.js";
import { OrderItemEntity } from "./order-item.entity.js";
import { OrderLine } from "./order-line.value-object.js";

type ProductId = OrderItemEntity["id"];

type Lines = Map<ProductId, OrderLine>;
type LineAsTuple = [ProductId, OrderLine];

interface OrderLinesProperties {
    items: Lines;
}

export class OrderLines extends ValueObject<OrderLinesProperties> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected validate(_: OrderLinesProperties): void {}

    static createLinesMap(lines: Lines): Lines {
        return new Map(lines);
    }

    constructor(items: Lines | LineAsTuple[] = new Map()) {
        if (Array.isArray(items)) {
            super({ items: new Map(items) });
            return;
        }
        super({ items });
    }

    addProduct(product: OrderItemEntity, quantity: number): OrderLines {
        const key = product.id;
        const existingOrderLine = this.properties.items.get(key);
        const newQuantity = existingOrderLine ? existingOrderLine.quantity + quantity : quantity;
        const updated = OrderLines.createLinesMap(this.properties.items);
        updated.set(key, new OrderLine({ product, quantity: newQuantity }));
        return new OrderLines(updated);
    }

    changeQuantityOfProduct(product: OrderItemEntity, quantity: number): OrderLines {
        const key = product.id;
        const updated = OrderLines.createLinesMap(this.properties.items);
        if (quantity <= 0) {
            updated.delete(key);
        } else {
            updated.set(key, new OrderLine({ product, quantity }));
        }
        return new OrderLines(updated);
    }

    removeProduct(product: OrderItemEntity): OrderLines {
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
