import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { DriverLicenseCategory } from "./driver-license-category.enum.js";
import { VehicleAttribute } from "./vehicle-attribute.value-object.js";
import { VehicleStatus } from "./vehicle-status.enum.js";
import { VehicleAlreadyActiveError, VehicleAlreadyInactiveError } from "./vehicle.errors.js";
import { VehicleCreatedDomainEvent } from "./events/vehicle-created.domain-event.js";
import { VehicleStatusChangedDomainEvent } from "./events/vehicle-status-changed.domain-event.js";

const vehicleSchema = z.object({
    name: z.string().min(1),
    status: z.enum(VehicleStatus),
    requiredLicenseCategory: z.enum(DriverLicenseCategory),
    attributes: z.array(z.instanceof(VehicleAttribute)),
    vin: z.string().optional(),
    licensePlate: z.string().optional(),
    note: z.string().optional(),
    warehouseId: z.string().optional(),
});

export type VehicleProperties = z.infer<typeof vehicleSchema>;

export interface CreateVehicleProps {
    name: string;
    requiredLicenseCategory: DriverLicenseCategory;
    attributes?: VehicleAttribute[];
    vin?: string;
    licensePlate?: string;
    note?: string;
    warehouseId?: string;
}

export class VehicleAggregate extends AggregateRoot<VehicleProperties> {
    static create(props: CreateVehicleProps): VehicleAggregate {
        const vehicle = new VehicleAggregate({
            properties: {
                name: props.name,
                status: VehicleStatus.ACTIVE,
                requiredLicenseCategory: props.requiredLicenseCategory,
                attributes: props.attributes ?? [],
                vin: props.vin,
                licensePlate: props.licensePlate,
                note: props.note,
                warehouseId: props.warehouseId,
            },
        });

        vehicle.validate();

        vehicle.addEvent(
            new VehicleCreatedDomainEvent({
                aggregateId: vehicle.id,
                vehicleName: props.name,
            }),
        );

        return vehicle;
    }

    static reconstitute(props: EntityProps<VehicleProperties>): VehicleAggregate {
        return new VehicleAggregate(props);
    }

    validate(): void {
        vehicleSchema.parse(this.properties);
    }

    get name(): string {
        return this.properties.name;
    }

    get status(): VehicleStatus {
        return this.properties.status;
    }

    get requiredLicenseCategory(): DriverLicenseCategory {
        return this.properties.requiredLicenseCategory;
    }

    get attributes(): VehicleAttribute[] {
        return this.properties.attributes;
    }

    get vin(): string | undefined {
        return this.properties.vin;
    }

    get licensePlate(): string | undefined {
        return this.properties.licensePlate;
    }

    get note(): string | undefined {
        return this.properties.note;
    }

    get warehouseId(): string | undefined {
        return this.properties.warehouseId;
    }

    update(
        props: Partial<
            Pick<
                VehicleProperties,
                "name" | "requiredLicenseCategory" | "attributes" | "vin" | "licensePlate" | "note" | "warehouseId"
            >
        >,
    ): void {
        Object.assign(this.properties, props);
        this.validate();
    }

    activate(): void {
        if (this.status === VehicleStatus.ACTIVE) {
            throw new VehicleAlreadyActiveError(this.id as string);
        }
        this.properties.status = VehicleStatus.ACTIVE;
        this.addEvent(
            new VehicleStatusChangedDomainEvent({
                aggregateId: this.id,
                newStatus: VehicleStatus.ACTIVE,
            }),
        );
    }

    deactivate(): void {
        if (this.status === VehicleStatus.INACTIVE) {
            throw new VehicleAlreadyInactiveError(this.id as string);
        }
        this.properties.status = VehicleStatus.INACTIVE;
        this.addEvent(
            new VehicleStatusChangedDomainEvent({
                aggregateId: this.id,
                newStatus: VehicleStatus.INACTIVE,
            }),
        );
    }
}
