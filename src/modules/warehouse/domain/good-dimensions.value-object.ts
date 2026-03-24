import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

export enum DimensionUnit {
    MM = "mm",
    CM = "cm",
    M = "m",
}

const goodDimensionsSchema = z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(DimensionUnit),
});

export type GoodDimensionsProperties = z.infer<typeof goodDimensionsSchema>;

export class GoodDimensions extends ValueObjectWithSchema<GoodDimensionsProperties> {
    protected get schema() {
        return goodDimensionsSchema;
    }

    get length(): number {
        return this.properties.length;
    }

    get width(): number {
        return this.properties.width;
    }

    get height(): number {
        return this.properties.height;
    }

    get unit(): DimensionUnit {
        return this.properties.unit;
    }
}
