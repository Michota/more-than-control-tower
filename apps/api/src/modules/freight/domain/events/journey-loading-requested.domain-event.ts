import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class JourneyLoadingRequestedDomainEvent extends DomainEvent {
    readonly loadingDeadline: string;

    constructor(properties: DomainEventProperties<JourneyLoadingRequestedDomainEvent>) {
        super(properties);
        this.loadingDeadline = properties.loadingDeadline;
    }
}
