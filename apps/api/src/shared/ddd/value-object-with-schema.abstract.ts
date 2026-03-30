import { ValueObject } from "../../libs/ddd";
import { ValueObjectProperties } from "../../libs/ddd/value-objects/value-object.js";
import { ZodType } from "zod";

export abstract class ValueObjectWithSchema<T, Schema extends ZodType<T> = ZodType<T>> extends ValueObject<T> {
    protected abstract get schema(): Schema;

    protected validate(props: ValueObjectProperties<T>): void {
        this.schema.parse(props);
    }
}
