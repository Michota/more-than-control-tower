import { DomainEvent, DomainEventProperties } from "../../../../libs/ddd/index.js";

export interface GoodsReceiptConfirmedLine {
    goodId: string;
    quantity: number;
}

export class GoodsReceiptConfirmedDomainEvent extends DomainEvent {
    readonly targetWarehouseId: string;
    readonly lines: GoodsReceiptConfirmedLine[];

    constructor(properties: DomainEventProperties<GoodsReceiptConfirmedDomainEvent>) {
        super(properties);
        this.targetWarehouseId = properties.targetWarehouseId;
        this.lines = properties.lines;
    }
}
