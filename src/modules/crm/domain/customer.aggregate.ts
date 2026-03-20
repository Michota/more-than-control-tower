import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import z from "zod";
import { CustomerAddress } from "./customer-address.value-object.js";
import { CustomerContact } from "./customer-contact.value-object.js";
import { CustomerCreatedDomainEvent } from "./events/customer-created.domain-event.js";

const customerSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    addresses: z.array(z.instanceof(CustomerAddress)),
    contacts: z.array(z.instanceof(CustomerContact)).min(1, "Customer must have at least one contact"),
});

export type CustomerProperties = z.infer<typeof customerSchema>;

export class CustomerAggregate extends AggregateRoot<CustomerProperties> {
    static create(properties: CustomerProperties): CustomerAggregate {
        const customer = new CustomerAggregate({ properties });

        customer.validate();

        customer.addEvent(
            new CustomerCreatedDomainEvent({
                aggregateId: customer.id,
                customerName: properties.name,
            }),
        );

        return customer;
    }

    static reconstitute(props: EntityProps<CustomerProperties>): CustomerAggregate {
        return new CustomerAggregate(props);
    }

    validate(): void {
        customerSchema.parse(this.properties);
    }

    get name(): string {
        return this.properties.name;
    }

    get description(): string | undefined {
        return this.properties.description;
    }

    get addresses(): CustomerAddress[] {
        return this.properties.addresses;
    }

    get contacts(): CustomerContact[] {
        return this.properties.contacts;
    }
}
