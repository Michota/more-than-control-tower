import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

const geoLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

export type GeoLocationProperties = z.infer<typeof geoLocationSchema>;

export class GeoLocation extends ValueObjectWithSchema<GeoLocationProperties> {
    protected get schema() {
        return geoLocationSchema;
    }

    get latitude(): number {
        return this.properties.latitude;
    }

    get longitude(): number {
        return this.properties.longitude;
    }
}
