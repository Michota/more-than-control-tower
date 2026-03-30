import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import { addressPropertiesSchema } from "../../../shared/value-objects/address.value-object.js";

const routeStopSchema = z.object({
    customerId: z.string().min(1),
    customerName: z.string().min(1),
    address: addressPropertiesSchema,
    sequence: z.number().int().min(0),
});

export type RouteStopProperties = z.infer<typeof routeStopSchema>;

export class RouteStop extends ValueObjectWithSchema<RouteStopProperties> {
    protected get schema() {
        return routeStopSchema;
    }

    get customerId(): string {
        return this.properties.customerId;
    }

    get customerName(): string {
        return this.properties.customerName;
    }

    get address(): RouteStopProperties["address"] {
        return this.properties.address;
    }

    get sequence(): number {
        return this.properties.sequence;
    }
}
