import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { GoodDimensions } from "./good-dimensions.value-object.js";
import { GoodHistoryEntry } from "./good-history-entry.value-object.js";
import { GoodHistoryEventType } from "./good-history-event-type.enum.js";
import { GoodRemovalReason } from "./good-removal-reason.enum.js";
import { GoodWeight } from "./good-weight.value-object.js";
import { WarehouseLocation } from "./warehouse-location.value-object.js";
import { GoodNotInWarehouseError, IncorporatedGoodCannotBeManipulatedError } from "./good.errors.js";
import { GoodReceivedDomainEvent } from "./events/good-received.domain-event.js";
import { GoodRemovedFromWarehouseDomainEvent } from "./events/good-removed-from-warehouse.domain-event.js";
import { GoodTransferredDomainEvent } from "./events/good-transferred.domain-event.js";

const goodSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    weight: z.instanceof(GoodWeight),
    dimensions: z.instanceof(GoodDimensions),
    warehouseId: z.uuid().optional(),
    locationInWarehouse: z.instanceof(WarehouseLocation).optional(),
    parentId: z.uuid().optional(),
    history: z.array(z.instanceof(GoodHistoryEntry)),
});

export type GoodProperties = z.infer<typeof goodSchema>;

export interface ReceiveGoodProps {
    name: string;
    description?: string;
    weight: GoodWeight;
    dimensions: GoodDimensions;
    warehouseId: string;
    locationInWarehouse: WarehouseLocation;
    note?: string;
}

export class GoodAggregate extends AggregateRoot<GoodProperties> {
    static receive(props: ReceiveGoodProps): GoodAggregate {
        const firstEntry = new GoodHistoryEntry({
            eventType: GoodHistoryEventType.RECEIVED,
            toWarehouseId: props.warehouseId,
            note: props.note,
            occurredAt: new Date(),
        });

        const good = new GoodAggregate({
            properties: {
                name: props.name,
                description: props.description,
                weight: props.weight,
                dimensions: props.dimensions,
                warehouseId: props.warehouseId,
                locationInWarehouse: props.locationInWarehouse,
                history: [firstEntry],
            },
        });

        good.validate();

        good.addEvent(
            new GoodReceivedDomainEvent({
                aggregateId: good.id,
                goodName: props.name,
                warehouseId: props.warehouseId,
            }),
        );

        return good;
    }

    static reconstitute(props: EntityProps<GoodProperties>): GoodAggregate {
        return new GoodAggregate(props);
    }

    validate(): void {
        goodSchema.parse(this.properties);
    }

    get name(): string {
        return this.properties.name;
    }

    get description(): string | undefined {
        return this.properties.description;
    }

    get weight(): GoodWeight {
        return this.properties.weight;
    }

    get dimensions(): GoodDimensions {
        return this.properties.dimensions;
    }

    get warehouseId(): string | undefined {
        return this.properties.warehouseId;
    }

    get locationInWarehouse(): WarehouseLocation | undefined {
        return this.properties.locationInWarehouse;
    }

    get parentId(): string | undefined {
        return this.properties.parentId;
    }

    get history(): GoodHistoryEntry[] {
        return this.properties.history;
    }

    transfer(toWarehouseId: string, locationInWarehouse: WarehouseLocation, note?: string): void {
        if (!this.properties.warehouseId) {
            throw new GoodNotInWarehouseError();
        }
        if (this.properties.parentId) {
            throw new IncorporatedGoodCannotBeManipulatedError();
        }

        const fromWarehouseId = this.properties.warehouseId;
        this.properties.warehouseId = toWarehouseId;
        this.properties.locationInWarehouse = locationInWarehouse;
        this.properties.history = [
            ...this.properties.history,
            new GoodHistoryEntry({
                eventType: GoodHistoryEventType.TRANSFERRED,
                fromWarehouseId,
                toWarehouseId,
                note,
                occurredAt: new Date(),
            }),
        ];

        this.addEvent(
            new GoodTransferredDomainEvent({
                aggregateId: this.id,
                fromWarehouseId,
                toWarehouseId,
            }),
        );
    }

    removeFromWarehouse(reason: GoodRemovalReason, note?: string): void {
        if (!this.properties.warehouseId) {
            throw new GoodNotInWarehouseError();
        }
        if (this.properties.parentId) {
            throw new IncorporatedGoodCannotBeManipulatedError();
        }

        const fromWarehouseId = this.properties.warehouseId;
        this.properties.warehouseId = undefined;
        this.properties.locationInWarehouse = undefined;
        this.properties.history = [
            ...this.properties.history,
            new GoodHistoryEntry({
                eventType: GoodHistoryEventType.REMOVED,
                fromWarehouseId,
                removalReason: reason,
                note,
                occurredAt: new Date(),
            }),
        ];

        this.addEvent(
            new GoodRemovedFromWarehouseDomainEvent({
                aggregateId: this.id,
                fromWarehouseId,
                reason,
            }),
        );
    }
}
