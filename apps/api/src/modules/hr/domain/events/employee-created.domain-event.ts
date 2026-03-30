import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class EmployeeCreatedDomainEvent extends DomainEvent {
    readonly firstName: string;
    readonly lastName: string;

    constructor(properties: DomainEventProperties<EmployeeCreatedDomainEvent>) {
        super(properties);
        this.firstName = properties.firstName;
        this.lastName = properties.lastName;
    }
}
