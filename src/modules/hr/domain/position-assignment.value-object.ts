import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import z from "zod";

const positionAssignmentSchema = z.object({
    positionKey: z.string().min(1),
    assignedAt: z.date(),
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
}
