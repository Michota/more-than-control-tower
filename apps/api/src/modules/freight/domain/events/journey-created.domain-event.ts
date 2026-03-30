import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class JourneyCreatedDomainEvent extends DomainEvent {
    readonly routeId: string;
    readonly scheduledDate: string;

    constructor(properties: DomainEventProperties<JourneyCreatedDomainEvent>) {
        super(properties);
        this.routeId = properties.routeId;
        this.scheduledDate = properties.scheduledDate;
    }
}
