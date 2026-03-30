import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";
import { VehicleStatus } from "../vehicle-status.enum.js";

export class VehicleStatusChangedDomainEvent extends DomainEvent {
    readonly newStatus: VehicleStatus;

    constructor(properties: DomainEventProperties<VehicleStatusChangedDomainEvent>) {
        super(properties);
        this.newStatus = properties.newStatus;
    }
}
