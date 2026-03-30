import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import z from "zod";
import { ContactHistoryEntry } from "./contact-history-entry.value-object.js";
import { ContactType } from "./customer-contact-type.enum.js";

const historySchema = z.array(z.instanceof(ContactHistoryEntry)).default([]);

const customerContactSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(ContactType.EMAIL),
        title: z.string().min(1),
        description: z.string().optional(),
        note: z.string().optional(),
        value: z.string().email(),
        history: historySchema,
    }),
    z.object({
        type: z.literal(ContactType.PHONE),
        title: z.string().min(1),
        description: z.string().optional(),
        note: z.string().optional(),
        value: z.string().min(1),
        history: historySchema,
    }),
    z.object({
        type: z.literal(ContactType.CUSTOM),
        title: z.string().min(1),
        description: z.string().optional(),
        note: z.string().optional(),
        customLabel: z.string().min(1),
        value: z.string().min(1),
        history: historySchema,
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

    get note(): string | undefined {
        return this.properties.note;
    }

    get value(): string {
        return this.properties.value;
    }

    get customLabel(): string | undefined {
        return "customLabel" in this.properties ? this.properties.customLabel : undefined;
    }

    get history(): ContactHistoryEntry[] {
        return this.properties.history;
    }
}
