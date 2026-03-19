import { Entity, EntityProps } from "@src/libs/ddd";
import { Money } from "../../../shared/value-objects/money.js";
import { ItemPrice } from "./item-price.value-object.js";

interface OrderItem {
    price: ItemPrice;
}

export class OrderItemEntity extends Entity<OrderItem> {
    get price() {
        return this.properties.price;
    }

    static create(props: EntityProps<OrderItem>): OrderItemEntity {
        const item = new OrderItemEntity(props);
        item.validate();
        return item;
    }

    static reconstitute(props: EntityProps<OrderItem>): OrderItemEntity {
        return new OrderItemEntity(props);
    }

    public validate(): void {
        // no need to validate price, as Money will validate itself
    }

    changePrice(newPrice: Money) {
        this.properties.price = new ItemPrice({ price: newPrice, itemId: this.id });
    }
}
