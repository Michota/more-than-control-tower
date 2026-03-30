import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

const vehicleAttributeSchema = z.object({
    name: z.string().min(1),
    value: z.string().min(1),
});

export type VehicleAttributeProperties = z.infer<typeof vehicleAttributeSchema>;

export class VehicleAttribute extends ValueObjectWithSchema<VehicleAttributeProperties> {
    protected get schema() {
        return vehicleAttributeSchema;
    }

    get name(): string {
        return this.properties.name;
    }

    get value(): string {
        return this.properties.value;
    }
}
