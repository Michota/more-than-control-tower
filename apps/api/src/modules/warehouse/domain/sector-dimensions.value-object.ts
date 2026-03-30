import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import { DimensionUnit } from "./good-dimensions.value-object.js";

const sectorDimensionsSchema = z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(DimensionUnit),
});

export type SectorDimensionsProperties = z.infer<typeof sectorDimensionsSchema>;

export class SectorDimensions extends ValueObjectWithSchema<SectorDimensionsProperties> {
    protected get schema() {
        return sectorDimensionsSchema;
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
