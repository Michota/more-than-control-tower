import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/domain-event.abstract.js";

export class WorkingHoursLoggedDomainEvent extends DomainEvent {
    readonly employeeId: string;
    readonly date: string;
    readonly hours: number;
    readonly activityId?: string;

    constructor(properties: DomainEventProperties<WorkingHoursLoggedDomainEvent>) {
        super(properties);
        this.employeeId = properties.employeeId;
        this.date = properties.date;
        this.hours = properties.hours;
        this.activityId = properties.activityId;
    }
}
