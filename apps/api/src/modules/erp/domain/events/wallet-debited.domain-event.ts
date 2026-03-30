import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/domain-event.abstract.js";

export class WalletDebitedDomainEvent extends DomainEvent {
    readonly employeeId: string;
    readonly amount: string;
    readonly currency: string;
    readonly reason: string;

    constructor(properties: DomainEventProperties<WalletDebitedDomainEvent>) {
        super(properties);
        this.employeeId = properties.employeeId;
        this.amount = properties.amount;
        this.currency = properties.currency;
        this.reason = properties.reason;
    }
}
