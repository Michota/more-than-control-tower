import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class WarehouseCreatedDomainEvent extends DomainEvent {
    readonly warehouseName: string;

    constructor(properties: DomainEventProperties<WarehouseCreatedDomainEvent>) {
        super(properties);
        this.warehouseName = properties.warehouseName;
    }
}
