import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import { addressPropertiesSchema } from "../../../shared/value-objects/address.value-object.js";

const journeyStopSchema = z.object({
    customerId: z.string().min(1),
    customerName: z.string().min(1),
    address: addressPropertiesSchema,
    orderIds: z.array(z.string()),
    sequence: z.number().int().min(0),
});

export type JourneyStopProperties = z.infer<typeof journeyStopSchema>;

export class JourneyStop extends ValueObjectWithSchema<JourneyStopProperties> {
    protected get schema() {
        return journeyStopSchema;
    }

    get customerId(): string {
        return this.properties.customerId;
    }

    get customerName(): string {
        return this.properties.customerName;
    }

    get address(): JourneyStopProperties["address"] {
        return this.properties.address;
    }

    get orderIds(): string[] {
        return this.properties.orderIds;
    }

    get sequence(): number {
        return this.properties.sequence;
    }

    withOrders(orderIds: string[]): JourneyStop {
        return new JourneyStop({
            ...this.properties,
            orderIds,
        });
    }

    withSequence(sequence: number): JourneyStop {
        return new JourneyStop({
            ...this.properties,
            sequence,
        });
    }
}
