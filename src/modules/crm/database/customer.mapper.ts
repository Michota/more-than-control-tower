import { RequiredEntityData } from "@mikro-orm/core";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { CustomerAddress as DomainCustomerAddress } from "../domain/customer-address.value-object.js";
import { CustomerContact as DomainCustomerContact } from "../domain/customer-contact.value-object.js";
import { ContactType } from "../domain/customer-contact-type.enum.js";
import { CustomerAggregate } from "../domain/customer.aggregate.js";
import { Customer } from "./customer.entity.js";

export class CustomerMapper implements Mapper<CustomerAggregate, RequiredEntityData<Customer>> {
    toDomain(record: Customer): CustomerAggregate {
        const addresses = record.addresses.getItems().map(
            (a) =>
                new DomainCustomerAddress({
                    label: a.label ?? undefined,
                    country: a.country,
                    state: a.state,
                    city: a.city,
                    postalCode: a.postalCode,
                    street: a.street,
                }),
        );

        const contacts = record.contacts.getItems().map(
            (c) =>
                new DomainCustomerContact({
                    type: c.type as ContactType,
                    title: c.title,
                    description: c.description ?? undefined,
                    value: c.value,
                }),
        );

        return CustomerAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                description: record.description ?? undefined,
                addresses,
                contacts,
            },
        });
    }

    toPersistence(domain: CustomerAggregate): RequiredEntityData<Customer> {
        return {
            id: domain.id as string,
            name: domain.name,
            description: domain.description,
            addresses: domain.addresses.map((a) => ({
                label: a.label,
                country: a.country,
                state: a.state,
                city: a.city,
                postalCode: a.postalCode,
                street: a.street,
            })) as RequiredEntityData<Customer>["addresses"],
            contacts: domain.contacts.map((c) => ({
                type: c.type,
                title: c.title,
                description: c.description,
                value: c.value,
            })) as RequiredEntityData<Customer>["contacts"],
        };
    }

    toResponse(entity: CustomerAggregate): unknown {
        return entity.toObject();
    }
}
