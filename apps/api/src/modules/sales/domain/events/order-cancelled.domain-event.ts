import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd";

export class OrderCancelledDomainEvent extends DomainEvent {
    readonly customerId: string;

    constructor(properties: DomainEventProperties<OrderCancelledDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
    }
}
