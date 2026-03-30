import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd";

export class OrderCompletedDomainEvent extends DomainEvent {
    readonly customerId: string;

    constructor(properties: DomainEventProperties<OrderCompletedDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
    }
}
