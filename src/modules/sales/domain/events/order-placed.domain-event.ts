import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd";

export class OrderPlacedDomainEvent extends DomainEvent {
    readonly customerId: string;

    constructor(properties: DomainEventProperties<OrderPlacedDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
    }
}
