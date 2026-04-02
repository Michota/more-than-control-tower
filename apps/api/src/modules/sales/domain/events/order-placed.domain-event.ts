import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class OrderPlacedDomainEvent extends DomainEvent {
    readonly customerId: string;

    constructor(properties: DomainEventProperties<OrderPlacedDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
    }
}
