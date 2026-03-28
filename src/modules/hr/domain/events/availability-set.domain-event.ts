import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class AvailabilitySetDomainEvent extends DomainEvent {
    readonly employeeId: string;
    readonly date: string;
    readonly status: string;

    constructor(properties: DomainEventProperties<AvailabilitySetDomainEvent>) {
        super(properties);
        this.employeeId = properties.employeeId;
        this.date = properties.date;
        this.status = properties.status;
    }
}
