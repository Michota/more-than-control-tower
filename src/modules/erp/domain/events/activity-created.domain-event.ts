import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/domain-event.abstract.js";

export class ActivityCreatedDomainEvent extends DomainEvent {
    readonly name: string;

    constructor(properties: DomainEventProperties<ActivityCreatedDomainEvent>) {
        super(properties);
        this.name = properties.name;
    }
}
