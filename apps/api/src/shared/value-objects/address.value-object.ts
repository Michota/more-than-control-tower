import z from "zod";
import { ValueObjectWithSchema } from "../ddd/value-object-with-schema.abstract";

// TODO: improve these types to be more specific, for example we can create a validation for country, state, city, etc...
export const addressPropertiesSchema = z.object({
    country: z.string(),
    postalCode: z.string(),
    state: z.string(),
    city: z.string(),
    street: z.string(),
});

type AddressProperties = z.infer<typeof addressPropertiesSchema>;

export class Address extends ValueObjectWithSchema<AddressProperties> {
    protected get schema() {
        return addressPropertiesSchema;
    }

    get country(): string {
        return this.properties.country;
    }

    get state(): string {
        return this.properties.state;
    }

    get city(): string {
        return this.properties.city;
    }

    get postalCode(): string {
        return this.properties.postalCode;
    }

    get street(): string {
        return this.properties.street;
    }
}
