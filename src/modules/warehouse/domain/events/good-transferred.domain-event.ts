import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class GoodTransferredDomainEvent extends DomainEvent {
    readonly fromWarehouseId: string;
    readonly toWarehouseId: string;

    constructor(properties: DomainEventProperties<GoodTransferredDomainEvent>) {
        super(properties);
        this.fromWarehouseId = properties.fromWarehouseId;
        this.toWarehouseId = properties.toWarehouseId;
    }
}
