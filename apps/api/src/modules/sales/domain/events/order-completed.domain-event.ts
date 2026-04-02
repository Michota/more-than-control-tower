import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class OrderCompletedDomainEvent extends DomainEvent {
    readonly customerId: string;

    constructor(properties: DomainEventProperties<OrderCompletedDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
    }
}
