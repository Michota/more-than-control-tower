import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class EmployeeLinkedToUserDomainEvent extends DomainEvent {
    readonly userId: string;

    constructor(properties: DomainEventProperties<EmployeeLinkedToUserDomainEvent>) {
        super(properties);
        this.userId = properties.userId;
    }
}
