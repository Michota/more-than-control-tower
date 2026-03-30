import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd";

export class OrderInProgressDomainEvent extends DomainEvent {
    readonly customerId: string;

    constructor(properties: DomainEventProperties<OrderInProgressDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
    }
}
