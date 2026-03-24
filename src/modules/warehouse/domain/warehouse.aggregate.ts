import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { Address } from "../../../shared/value-objects/address.value-object.js";
import { GeoLocation } from "./geo-location.value-object.js";
import { WarehouseStatus } from "./warehouse-status.enum.js";
import { WarehouseCreatedDomainEvent } from "./events/warehouse-created.domain-event.js";

const warehouseSchema = z.object({
    name: z.string().min(1),
    location: z.instanceof(GeoLocation),
    address: z.instanceof(Address),
    status: z.enum(WarehouseStatus),
});

export type WarehouseProperties = z.infer<typeof warehouseSchema>;

export interface CreateWarehouseProps {
    name: string;
    location: GeoLocation;
    address: Address;
}

export class WarehouseAggregate extends AggregateRoot<WarehouseProperties> {
    static create(props: CreateWarehouseProps): WarehouseAggregate {
        const warehouse = new WarehouseAggregate({
            properties: {
                name: props.name,
                location: props.location,
                address: props.address,
                status: WarehouseStatus.ACTIVE,
            },
        });

        warehouse.validate();

        warehouse.addEvent(
            new WarehouseCreatedDomainEvent({
                aggregateId: warehouse.id,
                warehouseName: props.name,
            }),
        );

        return warehouse;
    }

    static reconstitute(props: EntityProps<WarehouseProperties>): WarehouseAggregate {
        return new WarehouseAggregate(props);
    }

    validate(): void {
        warehouseSchema.parse(this.properties);
    }

    get name(): string {
        return this.properties.name;
    }

    get location(): GeoLocation {
        return this.properties.location;
    }

    get address(): Address {
        return this.properties.address;
    }

    get status(): WarehouseStatus {
        return this.properties.status;
    }

    update(props: Partial<Omit<WarehouseProperties, "status">>): void {
        Object.assign(this.properties, props);
        this.validate();
    }

    activate(): void {
        this.properties.status = WarehouseStatus.ACTIVE;
    }

    deactivate(): void {
        this.properties.status = WarehouseStatus.INACTIVE;
    }
}
