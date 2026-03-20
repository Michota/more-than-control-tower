import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import { addressPropertiesSchema } from "../../../shared/value-objects/address.value-object.js";
import z from "zod";

const customerAddressSchema = addressPropertiesSchema.extend({
    label: z.string().optional(),
});

export type CustomerAddressProperties = z.infer<typeof customerAddressSchema>;

export class CustomerAddress extends ValueObjectWithSchema<CustomerAddressProperties> {
    protected get schema() {
        return customerAddressSchema;
    }

    get label(): string | undefined {
        return this.properties.label;
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
