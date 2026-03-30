import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class SystemUserSuspendedDomainEvent extends DomainEvent {
    readonly email: string;

    constructor(properties: DomainEventProperties<SystemUserSuspendedDomainEvent>) {
        super(properties);
        this.email = properties.email;
    }
}
