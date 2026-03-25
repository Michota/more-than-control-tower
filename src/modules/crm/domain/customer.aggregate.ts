import { AggregateRoot } from "../../../libs/ddd/aggregate-root.abstract.js";
import { EntityProps } from "../../../libs/ddd/entities/entity.abstract.js";
import z from "zod";
import { CustomerAddress } from "./customer-address.value-object.js";
import { CustomerContact } from "./customer-contact.value-object.js";
import { CustomerType } from "./customer-type.enum.js";
import { CustomerCreatedDomainEvent } from "./events/customer-created.domain-event.js";

const customerSchema = z
    .object({
        name: z.string().min(1),
        customerType: z.enum(CustomerType),
        description: z.string().optional(),
        note: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        companyName: z.string().optional(),
        nip: z.string().optional(),
        addresses: z.array(z.instanceof(CustomerAddress)),
        contacts: z.array(z.instanceof(CustomerContact)).min(1, "Customer must have at least one contact"),
    })
    .refine(
        (data) => {
            if (data.customerType === CustomerType.B2C) {
                return !!data.firstName && !!data.lastName;
            }
            return true;
        },
        { message: "B2C customers must have firstName and lastName" },
    )
    .refine(
        (data) => {
            if (data.customerType === CustomerType.B2B) {
                return !!data.companyName && !!data.nip;
            }
            return true;
        },
        { message: "B2B customers must have companyName and nip" },
    );

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

    update(props: Partial<Omit<CustomerProperties, "customerType">>): void {
        Object.assign(this.properties, props);
        this.validate();
    }

    get name(): string {
        return this.properties.name;
    }

    get customerType(): CustomerType {
        return this.properties.customerType;
    }

    get description(): string | undefined {
        return this.properties.description;
    }

    get note(): string | undefined {
        return this.properties.note;
    }

    get firstName(): string | undefined {
        return this.properties.firstName;
    }

    get lastName(): string | undefined {
        return this.properties.lastName;
    }

    get companyName(): string | undefined {
        return this.properties.companyName;
    }

    get nip(): string | undefined {
        return this.properties.nip;
    }

    get addresses(): CustomerAddress[] {
        return this.properties.addresses;
    }

    get contacts(): CustomerContact[] {
        return this.properties.contacts;
    }
}
