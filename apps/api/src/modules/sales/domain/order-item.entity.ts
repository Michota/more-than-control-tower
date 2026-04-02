import { Entity, EntityProps } from "../../../libs/ddd/index.js";
import { Money } from "../../../shared/value-objects/money.js";

interface OrderItemProperties {
    price: Money;
}

export class OrderItemEntity extends Entity<OrderItemProperties> {
    get price(): Money {
        return this.properties.price;
    }

    static create(props: EntityProps<OrderItemProperties>): OrderItemEntity {
        const item = new OrderItemEntity(props);
        item.validate();
        return item;
    }

    static reconstitute(props: EntityProps<OrderItemProperties>): OrderItemEntity {
        return new OrderItemEntity(props);
    }

    public validate(): void {
        // no need to validate price, as Money will validate itself
    }

    changePrice(newPrice: Money): void {
        this.properties.price = newPrice;
    }
}
