import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class AvailabilityConfirmedDomainEvent extends DomainEvent {
    readonly employeeId: string;
    readonly date: string;

    constructor(properties: DomainEventProperties<AvailabilityConfirmedDomainEvent>) {
        super(properties);
        this.employeeId = properties.employeeId;
        this.date = properties.date;
    }
}
