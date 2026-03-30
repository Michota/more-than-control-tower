import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";

const contactHistoryEntrySchema = z.object({
    previousValue: z.string(),
    changedAt: z.date(),
});

export type ContactHistoryEntryProperties = z.infer<typeof contactHistoryEntrySchema>;

export class ContactHistoryEntry extends ValueObjectWithSchema<ContactHistoryEntryProperties> {
    protected get schema() {
        return contactHistoryEntrySchema;
    }

    get previousValue(): string {
        return this.properties.previousValue;
    }

    get changedAt(): Date {
        return this.properties.changedAt;
    }
}
