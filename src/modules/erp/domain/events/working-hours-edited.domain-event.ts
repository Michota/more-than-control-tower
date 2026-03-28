import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/domain-event.abstract.js";

export class WorkingHoursEditedDomainEvent extends DomainEvent {
    readonly employeeId: string;
    readonly hours: number;

    constructor(properties: DomainEventProperties<WorkingHoursEditedDomainEvent>) {
        super(properties);
        this.employeeId = properties.employeeId;
        this.hours = properties.hours;
    }
}
