import { defineEntity, p } from "@mikro-orm/core";
import { Customer } from "./customer.entity.js";
import { ContactType } from "../domain/customer-contact-type.enum.js";
import { ContactHistoryEntry } from "./contact-history-entry.embeddable.js";

const CustomerContactSchema = defineEntity({
    name: "CustomerContact",
    tableName: "customer_contact",
    properties: {
        id: p.uuid().primary().defaultRaw("gen_random_uuid()"),
        type: p.enum(() => ContactType),
        title: p.string(),
        description: p.string().nullable(),
        note: p.string().nullable(),
        customLabel: p.string().nullable(),
        value: p.string(),
        history: p.embedded(ContactHistoryEntry).array().default([]),
        customer: () => p.manyToOne(Customer).inversedBy("contacts"),
    },
});

class CustomerContact extends CustomerContactSchema.class {}

CustomerContactSchema.setClass(CustomerContact);

export { CustomerContact, CustomerContactSchema };
