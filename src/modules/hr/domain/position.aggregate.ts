import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import z from "zod";
import type { QualificationSchemaEntry, QualificationValueType } from "../../../shared/positions/position.types.js";

const qualificationValueTypes: [QualificationValueType, ...QualificationValueType[]] = [
    "STRING",
    "NUMBER",
    "STRING_ARRAY",
];

const qualificationSchemaEntrySchema = z.object({
    key: z.string().min(1),
    type: z.enum(qualificationValueTypes),
    description: z.string().min(1),
    required: z.boolean().optional(),
});

const positionSchema = z.object({
    key: z
        .string()
        .min(1)
        .regex(/^[a-z]+:[a-z][-a-z]*$/, "Position key must be namespaced (e.g., 'freight:driver')"),
    displayName: z.string().min(1),
    qualificationSchema: z.array(qualificationSchemaEntrySchema),
    permissionKeys: z.array(z.string().min(1)),
});

export type PositionProperties = z.infer<typeof positionSchema>;

export class PositionAggregate extends AggregateRoot<PositionProperties> {
    static create(properties: PositionProperties): PositionAggregate {
        const position = new PositionAggregate({ properties });
        position.validate();
        return position;
    }

    static reconstitute(props: EntityProps<PositionProperties>): PositionAggregate {
        return new PositionAggregate(props);
    }

    validate(): void {
        positionSchema.parse(this.properties);
    }

    update(props: Partial<Pick<PositionProperties, "displayName" | "qualificationSchema" | "permissionKeys">>): void {
        Object.assign(this.properties, props);
        this.validate();
    }

    get key(): string {
        return this.properties.key;
    }

    get displayName(): string {
        return this.properties.displayName;
    }

    get qualificationSchema(): QualificationSchemaEntry[] {
        return this.properties.qualificationSchema;
    }

    get permissionKeys(): string[] {
        return this.properties.permissionKeys;
    }

    hasPermission(permissionKey: string): boolean {
        return this.properties.permissionKeys.includes(permissionKey);
    }
}
