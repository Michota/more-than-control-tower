import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class GoodAssignedToOrderDomainEvent extends DomainEvent {
    readonly productId: string;
    readonly goodId: string;

    constructor(properties: DomainEventProperties<GoodAssignedToOrderDomainEvent>) {
        super(properties);

        this.productId = properties.productId;
        this.goodId = properties.goodId;
    }
}
