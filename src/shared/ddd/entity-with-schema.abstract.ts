import { Entity } from "@src/libs/ddd";
import { ZodType } from "zod";

export abstract class EntityWithSchema<T, PropertiesSchema extends ZodType<T> = ZodType<T>> extends Entity<T> {
    protected abstract schema: PropertiesSchema;

    /**
     * This method should be called in the constructor of the child class after setting the properties, to validate the properties against the schema.
     */
    validate(): void {
        this.schema.parse(this.properties);
    }
}
