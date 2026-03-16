import { Entity } from "@src/libs/ddd";
import { Money } from "./money.js";

interface ProductProperties {
    readonly price: Money;
}

export class Product extends Entity<ProductProperties> {
    get price() {
        return this.properties.price;
    }

    public validate(): void {
        throw new Error("Method not implemented.");
    }
}
