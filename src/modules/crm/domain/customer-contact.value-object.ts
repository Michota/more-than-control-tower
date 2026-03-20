import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import z from "zod";
import { ContactType } from "./customer-contact-type.enum.js";

const customerContactSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(ContactType.EMAIL),
        title: z.string().min(1),
        description: z.string().optional(),
        value: z.string().email(),
    }),
    z.object({
        type: z.literal(ContactType.PHONE),
        title: z.string().min(1),
        description: z.string().optional(),
        value: z.string().min(1),
    }),
]);

export type CustomerContactProperties = z.infer<typeof customerContactSchema>;

export class CustomerContact extends ValueObjectWithSchema<CustomerContactProperties> {
    protected get schema() {
        return customerContactSchema;
    }

    get type(): ContactType {
        return this.properties.type;
    }

    get title(): string {
        return this.properties.title;
    }

    get description(): string | undefined {
        return this.properties.description;
    }

    get value(): string {
        return this.properties.value;
    }
}
