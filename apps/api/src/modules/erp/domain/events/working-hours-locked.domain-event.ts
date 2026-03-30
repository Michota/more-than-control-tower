import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/domain-event.abstract.js";

export class WorkingHoursLockedDomainEvent extends DomainEvent {
    readonly employeeId: string;
    readonly lockedBy: string;

    constructor(properties: DomainEventProperties<WorkingHoursLockedDomainEvent>) {
        super(properties);
        this.employeeId = properties.employeeId;
        this.lockedBy = properties.lockedBy;
    }
}
