import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class StockTransferredDomainEvent extends DomainEvent {
    readonly goodId: string;
    readonly fromWarehouseId: string;
    readonly toWarehouseId: string;
    readonly quantity: number;

    constructor(properties: DomainEventProperties<StockTransferredDomainEvent>) {
        super(properties);
        this.goodId = properties.goodId;
        this.fromWarehouseId = properties.fromWarehouseId;
        this.toWarehouseId = properties.toWarehouseId;
        this.quantity = properties.quantity;
    }
}
