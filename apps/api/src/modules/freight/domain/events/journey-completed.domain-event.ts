import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class JourneyCompletedDomainEvent extends DomainEvent {
    constructor(properties: DomainEventProperties<JourneyCompletedDomainEvent>) {
        super(properties);
    }
}
