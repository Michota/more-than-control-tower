import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class StockTransferRequestCreatedDomainEvent extends DomainEvent {
    readonly goodId: string;
    readonly quantity: number;
    readonly fromWarehouseId: string;
    readonly toWarehouseId: string;
    readonly requestedBy?: string;

    constructor(properties: DomainEventProperties<StockTransferRequestCreatedDomainEvent>) {
        super(properties);
        this.goodId = properties.goodId;
        this.quantity = properties.quantity;
        this.fromWarehouseId = properties.fromWarehouseId;
        this.toWarehouseId = properties.toWarehouseId;
        this.requestedBy = properties.requestedBy;
    }
}
