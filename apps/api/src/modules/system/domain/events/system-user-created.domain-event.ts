import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class SystemUserCreatedDomainEvent extends DomainEvent {
    readonly email: string;

    constructor(properties: DomainEventProperties<SystemUserCreatedDomainEvent>) {
        super(properties);
        this.email = properties.email;
    }
}
