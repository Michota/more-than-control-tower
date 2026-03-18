import { EntityProps } from "@src/libs/ddd";
import z from "zod";
import { EntityWithSchema } from "../ddd/entity-with-schema.abstract";

const customerPropertiesSchema = z.object({
    email: z.email(),
    phoneNumber: z.number(),
});

type CustomerProperties = z.infer<typeof customerPropertiesSchema>;

export class Customer extends EntityWithSchema<CustomerProperties> {
    protected schema = customerPropertiesSchema;

    static create(props: EntityProps<CustomerProperties>): Customer {
        const newCustomer = new Customer(props);
        newCustomer.validate();
        return newCustomer;
    }

    static reconstitute(props: EntityProps<CustomerProperties>): Customer {
        return new Customer(props);
    }
}
