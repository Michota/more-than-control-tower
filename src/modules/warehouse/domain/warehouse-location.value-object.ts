import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

const warehouseLocationSchema = z.object({
    description: z.string().min(1),
});

export type WarehouseLocationProperties = z.infer<typeof warehouseLocationSchema>;

export class WarehouseLocation extends ValueObjectWithSchema<WarehouseLocationProperties> {
    protected get schema() {
        return warehouseLocationSchema;
    }

    get description(): string {
        return this.properties.description;
    }
}
