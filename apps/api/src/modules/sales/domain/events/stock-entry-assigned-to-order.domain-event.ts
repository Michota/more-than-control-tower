import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class StockEntryAssignedToOrderDomainEvent extends DomainEvent {
    readonly productId: string;
    readonly stockEntryId: string;

    constructor(properties: DomainEventProperties<StockEntryAssignedToOrderDomainEvent>) {
        super(properties);

        this.productId = properties.productId;
        this.stockEntryId = properties.stockEntryId;
    }
}
