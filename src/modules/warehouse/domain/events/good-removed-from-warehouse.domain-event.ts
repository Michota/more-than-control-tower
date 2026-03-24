import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";
import { GoodRemovalReason } from "../good-removal-reason.enum.js";

export class GoodRemovedFromWarehouseDomainEvent extends DomainEvent {
    readonly fromWarehouseId: string;
    readonly reason: GoodRemovalReason;

    constructor(properties: DomainEventProperties<GoodRemovedFromWarehouseDomainEvent>) {
        super(properties);
        this.fromWarehouseId = properties.fromWarehouseId;
        this.reason = properties.reason;
    }
}
