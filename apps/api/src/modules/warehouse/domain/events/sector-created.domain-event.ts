import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class SectorCreatedDomainEvent extends DomainEvent {
    readonly warehouseId: string;
    readonly sectorName: string;

    constructor(properties: DomainEventProperties<SectorCreatedDomainEvent>) {
        super(properties);
        this.warehouseId = properties.warehouseId;
        this.sectorName = properties.sectorName;
    }
}
