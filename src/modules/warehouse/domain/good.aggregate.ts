import z from "zod";
import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { type EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import { GoodDimensions } from "./good-dimensions.value-object.js";
import { GoodWeight } from "./good-weight.value-object.js";
import { GoodCreatedDomainEvent } from "./events/good-created.domain-event.js";
import { IncorporatedGoodCannotBeEditedError } from "./good.errors.js";

const goodSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    weight: z.instanceof(GoodWeight),
    dimensions: z.instanceof(GoodDimensions),
    parentId: z.uuid().optional(),
});

export type GoodProperties = z.infer<typeof goodSchema>;

export class GoodAggregate extends AggregateRoot<GoodProperties> {
    static create(properties: GoodProperties): GoodAggregate {
        const good = new GoodAggregate({ properties });

        good.validate();

        good.addEvent(
            new GoodCreatedDomainEvent({
                aggregateId: good.id,
                goodName: properties.name,
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

    get parentId(): string | undefined {
        return this.properties.parentId;
    }

    update(props: Partial<GoodProperties>): void {
        if (this.properties.parentId) {
            throw new IncorporatedGoodCannotBeEditedError(this.id as string, this.properties.parentId);
        }
        Object.assign(this.properties, props);
        this.validate();
    }
}
