import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

export enum WeightUnit {
    KG = "kg",
    G = "g",
    LB = "lb",
}

const goodWeightSchema = z.object({
    value: z.number().positive(),
    unit: z.enum(WeightUnit),
});

export type GoodWeightProperties = z.infer<typeof goodWeightSchema>;

export class GoodWeight extends ValueObjectWithSchema<GoodWeightProperties> {
    protected get schema() {
        return goodWeightSchema;
    }

    get value(): number {
        return this.properties.value;
    }

    get unit(): WeightUnit {
        return this.properties.unit;
    }
}
