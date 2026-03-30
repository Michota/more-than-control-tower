import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class PositionUnassignedDomainEvent extends DomainEvent {
    readonly positionKey: string;

    constructor(properties: DomainEventProperties<PositionUnassignedDomainEvent>) {
        super(properties);
        this.positionKey = properties.positionKey;
    }
}
