import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class VehicleCreatedDomainEvent extends DomainEvent {
    readonly vehicleName: string;

    constructor(properties: DomainEventProperties<VehicleCreatedDomainEvent>) {
        super(properties);
        this.vehicleName = properties.vehicleName;
    }
}
