import { defineEntity, p } from "@mikro-orm/core";

const ContactHistoryEntrySchema = defineEntity({
    name: "ContactHistoryEntry",
    embeddable: true,
    properties: {
        previousValue: p.string(),
        changedAt: p.datetime(),
    },
});

class ContactHistoryEntry extends ContactHistoryEntrySchema.class {}

ContactHistoryEntrySchema.setClass(ContactHistoryEntry);

export { ContactHistoryEntry, ContactHistoryEntrySchema };
