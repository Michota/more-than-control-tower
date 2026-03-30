import { defineEntity, p } from "@mikro-orm/core";
import { Customer } from "./customer.entity.js";

const CustomerAddressSchema = defineEntity({
    name: "CustomerAddress",
    tableName: "customer_address",
    properties: {
        id: p.uuid().primary().defaultRaw("gen_random_uuid()"),
        label: p.string().nullable(),
        note: p.string().nullable(),
        country: p.string(),
        state: p.string(),
        city: p.string(),
        postalCode: p.string(),
        street: p.string(),
        customer: () => p.manyToOne(Customer).inversedBy("addresses"),
    },
});

class CustomerAddress extends CustomerAddressSchema.class {}

CustomerAddressSchema.setClass(CustomerAddress);

export { CustomerAddress, CustomerAddressSchema };
