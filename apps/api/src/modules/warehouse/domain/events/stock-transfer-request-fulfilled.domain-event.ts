import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class StockTransferRequestFulfilledDomainEvent extends DomainEvent {
    readonly goodId: string;
    readonly quantity: number;
    readonly fromWarehouseId: string;
    readonly toWarehouseId: string;

    constructor(properties: DomainEventProperties<StockTransferRequestFulfilledDomainEvent>) {
        super(properties);
        this.goodId = properties.goodId;
        this.quantity = properties.quantity;
        this.fromWarehouseId = properties.fromWarehouseId;
        this.toWarehouseId = properties.toWarehouseId;
    }
}
