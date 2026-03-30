import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class EmployeeDeactivatedDomainEvent extends DomainEvent {
    readonly userId?: string;

    constructor(properties: DomainEventProperties<EmployeeDeactivatedDomainEvent>) {
        super(properties);
        this.userId = properties.userId;
    }
}
