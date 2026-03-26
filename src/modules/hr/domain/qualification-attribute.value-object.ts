import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import z from "zod";
import type { QualificationValueType } from "../../../shared/positions/position.types.js";

const qualificationValueTypes: [QualificationValueType, ...QualificationValueType[]] = [
    "STRING",
    "NUMBER",
    "STRING_ARRAY",
];

const qualificationAttributeSchema = z.object({
    key: z.string().min(1),
    type: z.enum(qualificationValueTypes),
    value: z.string().min(1),
});

export type QualificationAttributeProperties = z.infer<typeof qualificationAttributeSchema>;

export class QualificationAttribute extends ValueObjectWithSchema<QualificationAttributeProperties> {
    protected get schema() {
        return qualificationAttributeSchema;
    }

    get key(): string {
        return this.properties.key;
    }

    get type(): QualificationValueType {
        return this.properties.type;
    }

    get value(): string {
        return this.properties.value;
    }
}
