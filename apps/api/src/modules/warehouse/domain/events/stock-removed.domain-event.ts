import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";
import { StockRemovalReason } from "../stock-removal-reason.enum.js";

export class StockRemovedDomainEvent extends DomainEvent {
    readonly goodId: string;
    readonly warehouseId: string;
    readonly quantity: number;
    readonly reason: StockRemovalReason;

    constructor(properties: DomainEventProperties<StockRemovedDomainEvent>) {
        super(properties);
        this.goodId = properties.goodId;
        this.warehouseId = properties.warehouseId;
        this.quantity = properties.quantity;
        this.reason = properties.reason;
    }
}
