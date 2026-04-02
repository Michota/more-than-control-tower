import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class OrderCancelledDomainEvent extends DomainEvent {
    readonly customerId: string;

    constructor(properties: DomainEventProperties<OrderCancelledDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
    }
}
