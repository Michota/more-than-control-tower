import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd";
import { OrderLines } from "../order-lines.value-object";

export class OrderDraftedDomainEvent extends DomainEvent {
    readonly customerId: string;
    readonly orderLines: OrderLines;

    constructor(properties: DomainEventProperties<OrderDraftedDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
        this.orderLines = properties.orderLines;
    }
}
