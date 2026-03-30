import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class PositionAssignedDomainEvent extends DomainEvent {
    readonly positionKey: string;

    constructor(properties: DomainEventProperties<PositionAssignedDomainEvent>) {
        super(properties);
        this.positionKey = properties.positionKey;
    }
}
