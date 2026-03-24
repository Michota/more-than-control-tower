import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { SectorDimensions } from "./sector-dimensions.value-object.js";
import { SectorCapability } from "./sector-capability.enum.js";
import { SectorStatus } from "./sector-status.enum.js";
import { SectorCreatedDomainEvent } from "./events/sector-created.domain-event.js";

const sectorSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    warehouseId: z.uuid(),
    dimensions: z.instanceof(SectorDimensions),
    capabilities: z.array(z.enum(SectorCapability)),
    weightCapacityGrams: z.number().int().positive(),
    status: z.enum(SectorStatus),
});

export type SectorProperties = z.infer<typeof sectorSchema>;

export interface CreateSectorProps {
    name: string;
    description?: string;
    warehouseId: string;
    dimensions: SectorDimensions;
    capabilities: SectorCapability[];
    weightCapacityGrams: number;
}

export class SectorAggregate extends AggregateRoot<SectorProperties> {
    static create(props: CreateSectorProps): SectorAggregate {
        const sector = new SectorAggregate({
            properties: {
                name: props.name,
                description: props.description,
                warehouseId: props.warehouseId,
                dimensions: props.dimensions,
                capabilities: props.capabilities,
                weightCapacityGrams: props.weightCapacityGrams,
                status: SectorStatus.ACTIVE,
            },
        });

        sector.validate();

        sector.addEvent(
            new SectorCreatedDomainEvent({
                aggregateId: sector.id,
                warehouseId: props.warehouseId,
                sectorName: props.name,
            }),
        );

        return sector;
    }

    static reconstitute(props: EntityProps<SectorProperties>): SectorAggregate {
        return new SectorAggregate(props);
    }

    validate(): void {
        sectorSchema.parse(this.properties);
    }

    get name(): string {
        return this.properties.name;
    }

    get description(): string | undefined {
        return this.properties.description;
    }

    get warehouseId(): string {
        return this.properties.warehouseId;
    }

    get dimensions(): SectorDimensions {
        return this.properties.dimensions;
    }

    get capabilities(): SectorCapability[] {
        return this.properties.capabilities;
    }

    get weightCapacityGrams(): number {
        return this.properties.weightCapacityGrams;
    }

    get status(): SectorStatus {
        return this.properties.status;
    }

    update(props: Partial<Omit<SectorProperties, "warehouseId" | "status">>): void {
        Object.assign(this.properties, props);
        this.validate();
    }

    activate(): void {
        this.properties.status = SectorStatus.ACTIVE;
    }

    deactivate(): void {
        this.properties.status = SectorStatus.INACTIVE;
    }
}
