import { EntityProps } from "@src/libs/ddd";
import z from "zod";
import { EntityWithSchema } from "../ddd/entity-with-schema.abstract";

const customerPropertiesSchema = z.object({
    email: z.email(),
    phoneNumber: z.number(),
});

type CustomerPropertiesSchema = typeof customerPropertiesSchema;
type CustomerProperties = z.infer<CustomerPropertiesSchema>;

export class Customer extends EntityWithSchema<CustomerPropertiesSchema> {
    protected schema: CustomerPropertiesSchema = customerPropertiesSchema;

    static create(props: EntityProps<CustomerProperties>): Customer {
        const newCustomer = new Customer(props);
        newCustomer.validate();
        return newCustomer;
    }

    static reconstitute(props: EntityProps<CustomerProperties>): Customer {
        return new Customer(props);
    }
}
