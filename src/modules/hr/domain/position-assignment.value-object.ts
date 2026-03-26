import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import z from "zod";
import { QualificationAttribute } from "./qualification-attribute.value-object.js";

const positionAssignmentSchema = z.object({
    positionKey: z.string().min(1),
    assignedAt: z.date(),
    qualifications: z.array(z.instanceof(QualificationAttribute)),
});

export type PositionAssignmentProperties = z.infer<typeof positionAssignmentSchema>;

export class PositionAssignment extends ValueObjectWithSchema<PositionAssignmentProperties> {
    protected get schema() {
        return positionAssignmentSchema;
    }

    get positionKey(): string {
        return this.properties.positionKey;
    }

    get assignedAt(): Date {
        return this.properties.assignedAt;
    }

    get qualifications(): QualificationAttribute[] {
        return this.properties.qualifications;
    }

    hasQualification(key: string, value: string): boolean {
        const qual = this.properties.qualifications.find((q) => q.key === key);
        if (!qual) {
            return false;
        }
        if (qual.type === "STRING_ARRAY") {
            const values = JSON.parse(qual.value) as string[];
            return values.includes(value);
        }
        return qual.value === value;
    }
}
