import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export class GoodCreatedDomainEvent extends DomainEvent {
    readonly goodName: string;

    constructor(properties: DomainEventProperties<GoodCreatedDomainEvent>) {
        super(properties);
        this.goodName = properties.goodName;
    }
}
