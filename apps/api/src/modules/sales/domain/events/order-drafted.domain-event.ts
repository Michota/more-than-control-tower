import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd";
import { OrderLines } from "../order-lines.value-object";
import { OrderSource } from "../order-source.enum";

export class OrderDraftedDomainEvent extends DomainEvent {
    readonly customerId: string;
    readonly actorId: string;
    readonly source: OrderSource;
    readonly orderLines: OrderLines;

    constructor(properties: DomainEventProperties<OrderDraftedDomainEvent>) {
        super(properties);

        this.customerId = properties.customerId;
        this.actorId = properties.actorId;
        this.source = properties.source;
        this.orderLines = properties.orderLines;
    }
}
