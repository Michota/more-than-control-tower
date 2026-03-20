import { defineEntity, p } from "@mikro-orm/core";
import { CustomerAddress } from "./customer-address.entity.js";
import { CustomerContact } from "./customer-contact.entity.js";

const CustomerSchema = defineEntity({
    name: "Customer",
    tableName: "customer",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        description: p.string().nullable(),
        addresses: () => p.oneToMany(CustomerAddress).mappedBy("customer").orphanRemoval(),
        contacts: () => p.oneToMany(CustomerContact).mappedBy("customer").orphanRemoval(),
    },
});

class Customer extends CustomerSchema.class {}

CustomerSchema.setClass(Customer);

export { Customer, CustomerSchema };
