import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class RouteArchivedDomainEvent extends DomainEvent {
    constructor(properties: DomainEventProperties<RouteArchivedDomainEvent>) {
        super(properties);
    }
}
