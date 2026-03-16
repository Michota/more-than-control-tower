import { Product } from "../../../shared/value-objects/product.js";
import { Money } from "../../../shared/value-objects/money.js";
import { ValueObject } from "@src/libs/ddd/index.js";

interface OrderLineProperties {
    readonly product: Product;
    readonly quantity: number;
}

export class OrderLine extends ValueObject<OrderLineProperties> {
    protected validate(props: OrderLineProperties): void {
        if (props.quantity < 0) {
            throw new Error("Quantity cannot be negative");
        }

        props.product.validate();
    }

    constructor(properties: OrderLineProperties) {
        super(properties);
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

    static create(props: OrderLineProperties) {
        return new OrderLine(props);
    }

    withQuantity(quantity: number): OrderLine {
        return new OrderLine({ product: this.properties.product, quantity });
    }
}
