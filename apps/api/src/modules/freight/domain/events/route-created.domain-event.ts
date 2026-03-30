import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class RouteCreatedDomainEvent extends DomainEvent {
    readonly routeName: string;

    constructor(properties: DomainEventProperties<RouteCreatedDomainEvent>) {
        super(properties);
        this.routeName = properties.routeName;
    }
}
