import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class GoodReceivedDomainEvent extends DomainEvent {
    readonly goodName: string;
    readonly warehouseId: string;

    constructor(properties: DomainEventProperties<GoodReceivedDomainEvent>) {
        super(properties);
        this.goodName = properties.goodName;
        this.warehouseId = properties.warehouseId;
    }
}
