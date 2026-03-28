import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class JourneyStartedDomainEvent extends DomainEvent {
    constructor(properties: DomainEventProperties<JourneyStartedDomainEvent>) {
        super(properties);
    }
}
