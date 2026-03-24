import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { WarehouseLocation } from "./warehouse-location.value-object.js";
import { StockHistoryEntry } from "./stock-history-entry.value-object.js";
import { StockEventType } from "./stock-event-type.enum.js";
import { StockRemovalReason } from "./stock-removal-reason.enum.js";
import { InsufficientStockError } from "./good.errors.js";
import { StockReceivedDomainEvent } from "./events/stock-received.domain-event.js";
import { StockRemovedDomainEvent } from "./events/stock-removed.domain-event.js";
import { StockTransferredDomainEvent } from "./events/stock-transferred.domain-event.js";

const stockEntrySchema = z.object({
    goodId: z.uuid(),
    warehouseId: z.uuid(),
    sectorId: z.uuid().optional(),
    locationInWarehouse: z.instanceof(WarehouseLocation).optional(),
    quantity: z.number().int().min(0),
    history: z.array(z.instanceof(StockHistoryEntry)),
});

export type StockEntryProperties = z.infer<typeof stockEntrySchema>;

export class StockEntryAggregate extends AggregateRoot<StockEntryProperties> {
    static create(props: {
        goodId: string;
        warehouseId: string;
        quantity: number;
        sectorId?: string;
        locationDescription?: string;
        note?: string;
    }): StockEntryAggregate {
        const location = props.locationDescription
            ? new WarehouseLocation({ description: props.locationDescription })
            : undefined;

        const entry = new StockEntryAggregate({
            properties: {
                goodId: props.goodId,
                warehouseId: props.warehouseId,
                sectorId: props.sectorId,
                locationInWarehouse: location,
                quantity: props.quantity,
                history: [
                    new StockHistoryEntry({
                        eventType: StockEventType.RECEIVED,
                        quantityDelta: props.quantity,
                        quantityAfter: props.quantity,
                        note: props.note,
                        occurredAt: new Date(),
                    }),
                ],
            },
        });

        entry.validate();

        entry.addEvent(
            new StockReceivedDomainEvent({
                aggregateId: entry.id,
                goodId: props.goodId,
                warehouseId: props.warehouseId,
                quantity: props.quantity,
            }),
        );

        return entry;
    }

    static reconstitute(props: EntityProps<StockEntryProperties>): StockEntryAggregate {
        return new StockEntryAggregate(props);
    }

    validate(): void {
        stockEntrySchema.parse(this.properties);
    }

    get goodId(): string {
        return this.properties.goodId;
    }

    get warehouseId(): string {
        return this.properties.warehouseId;
    }

    get sectorId(): string | undefined {
        return this.properties.sectorId;
    }

    get locationInWarehouse(): WarehouseLocation | undefined {
        return this.properties.locationInWarehouse;
    }

    get quantity(): number {
        return this.properties.quantity;
    }

    get history(): StockHistoryEntry[] {
        return this.properties.history;
    }

    receive(quantity: number, opts?: { note?: string; locationDescription?: string; sectorId?: string }): void {
        if (opts?.locationDescription) {
            this.properties.locationInWarehouse = new WarehouseLocation({ description: opts.locationDescription });
        }
        if (opts?.sectorId !== undefined) {
            this.properties.sectorId = opts.sectorId;
        }

        const quantityAfter = this.properties.quantity + quantity;
        this.properties.quantity = quantityAfter;
        this.properties.history = [
            ...this.properties.history,
            new StockHistoryEntry({
                eventType: StockEventType.RECEIVED,
                quantityDelta: quantity,
                quantityAfter,
                note: opts?.note,
                occurredAt: new Date(),
            }),
        ];

        this.addEvent(
            new StockReceivedDomainEvent({
                aggregateId: this.id,
                goodId: this.properties.goodId,
                warehouseId: this.properties.warehouseId,
                quantity,
            }),
        );
    }

    remove(quantity: number, reason: StockRemovalReason, note?: string): void {
        if (quantity > this.properties.quantity) {
            throw new InsufficientStockError(this.properties.goodId, this.properties.quantity, quantity);
        }

        const quantityAfter = this.properties.quantity - quantity;
        this.properties.quantity = quantityAfter;
        this.properties.history = [
            ...this.properties.history,
            new StockHistoryEntry({
                eventType: StockEventType.REMOVED,
                quantityDelta: -quantity,
                quantityAfter,
                removalReason: reason,
                note,
                occurredAt: new Date(),
            }),
        ];

        this.addEvent(
            new StockRemovedDomainEvent({
                aggregateId: this.id,
                goodId: this.properties.goodId,
                warehouseId: this.properties.warehouseId,
                quantity,
                reason,
            }),
        );
    }

    transferOut(quantity: number, toWarehouseId: string, note?: string): void {
        if (quantity > this.properties.quantity) {
            throw new InsufficientStockError(this.properties.goodId, this.properties.quantity, quantity);
        }

        const quantityAfter = this.properties.quantity - quantity;
        this.properties.quantity = quantityAfter;
        this.properties.history = [
            ...this.properties.history,
            new StockHistoryEntry({
                eventType: StockEventType.TRANSFERRED_OUT,
                quantityDelta: -quantity,
                quantityAfter,
                relatedWarehouseId: toWarehouseId,
                note,
                occurredAt: new Date(),
            }),
        ];

        this.addEvent(
            new StockTransferredDomainEvent({
                aggregateId: this.id,
                goodId: this.properties.goodId,
                fromWarehouseId: this.properties.warehouseId,
                toWarehouseId,
                quantity,
            }),
        );
    }

    transferIn(
        quantity: number,
        fromWarehouseId: string,
        opts?: { note?: string; locationDescription?: string; sectorId?: string },
    ): void {
        if (opts?.locationDescription) {
            this.properties.locationInWarehouse = new WarehouseLocation({ description: opts.locationDescription });
        }
        if (opts?.sectorId !== undefined) {
            this.properties.sectorId = opts.sectorId;
        }

        const quantityAfter = this.properties.quantity + quantity;
        this.properties.quantity = quantityAfter;
        this.properties.history = [
            ...this.properties.history,
            new StockHistoryEntry({
                eventType: StockEventType.TRANSFERRED_IN,
                quantityDelta: quantity,
                quantityAfter,
                relatedWarehouseId: fromWarehouseId,
                note: opts?.note,
                occurredAt: new Date(),
            }),
        ];
    }

    moveToSector(sectorId?: string, note?: string): void {
        const previousSectorId = this.properties.sectorId;
        this.properties.sectorId = sectorId;
        this.properties.history = [
            ...this.properties.history,
            new StockHistoryEntry({
                eventType: StockEventType.MOVED_SECTOR,
                quantityDelta: 0,
                quantityAfter: this.properties.quantity,
                relatedSectorId: sectorId ?? previousSectorId,
                note,
                occurredAt: new Date(),
            }),
        ];
    }
}
