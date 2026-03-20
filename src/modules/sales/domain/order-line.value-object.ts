import { OrderItemEntity } from "./order-item.entity.js";
import { Money } from "../../../shared/value-objects/money.js";
import { ValueObject } from "../../../libs/ddd/index.js";

export interface OrderLineProperties {
    readonly product: OrderItemEntity;
    readonly quantity: number;
}

export class OrderLine extends ValueObject<OrderLineProperties> {
    protected validate(props: OrderLineProperties): void {
        if (props.quantity < 0) {
            throw new Error("Quantity cannot be negative");
        }

        props.product.validate();
    }

    get product() {
        return this.properties.product;
    }

    get quantity() {
        return this.properties.quantity;
    }

    get subtotal(): Money {
        return new Money(
            this.properties.product.price.amount.mul(this.properties.quantity),
            this.properties.product.price.currency,
        );
    }

    withQuantity(quantity: number): OrderLine {
        return new OrderLine({ product: this.properties.product, quantity });
    }
}
