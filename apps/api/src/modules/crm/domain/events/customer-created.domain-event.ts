import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class CustomerCreatedDomainEvent extends DomainEvent {
    readonly customerName: string;

    constructor(properties: DomainEventProperties<CustomerCreatedDomainEvent>) {
        super(properties);
        this.customerName = properties.customerName;
    }
}
