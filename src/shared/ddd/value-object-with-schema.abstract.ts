import { ValueObject } from "@src/libs/ddd";
import { ZodType } from "zod";

export abstract class ValueObjectWithSchema<T, Schema extends ZodType<T> = ZodType<T>> extends ValueObject<T> {
    protected abstract schema: Schema;

    /**
     * This method should be called in the constructor of the child class after setting the properties, to validate the properties against the schema.
     */
    validate(): void {
        this.schema.parse(this.properties);
    }
}
