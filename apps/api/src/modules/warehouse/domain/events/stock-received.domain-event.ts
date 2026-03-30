import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class StockReceivedDomainEvent extends DomainEvent {
    readonly goodId: string;
    readonly warehouseId: string;
    readonly quantity: number;

    constructor(properties: DomainEventProperties<StockReceivedDomainEvent>) {
        super(properties);
        this.goodId = properties.goodId;
        this.warehouseId = properties.warehouseId;
        this.quantity = properties.quantity;
    }
}
