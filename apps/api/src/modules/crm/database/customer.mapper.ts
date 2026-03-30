import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { GetCustomerResponse } from "../../../shared/queries/get-customer.query.js";
import { ContactHistoryEntry } from "../domain/contact-history-entry.value-object.js";
import { CustomerAddress as DomainCustomerAddress } from "../domain/customer-address.value-object.js";
import { CustomerContact as DomainCustomerContact } from "../domain/customer-contact.value-object.js";
import { ContactType } from "../domain/customer-contact-type.enum.js";
import { CustomerType } from "../domain/customer-type.enum.js";
import { CustomerAggregate } from "../domain/customer.aggregate.js";
import { Customer } from "./customer.entity.js";

@Injectable()
export class CustomerMapper implements Mapper<CustomerAggregate, RequiredEntityData<Customer>, GetCustomerResponse> {
    toDomain(record: Customer): CustomerAggregate {
        const addresses = record.addresses.getItems().map(
            (a) =>
                new DomainCustomerAddress({
                    label: a.label ?? undefined,
                    note: a.note ?? undefined,
                    country: a.country,
                    state: a.state,
                    city: a.city,
                    postalCode: a.postalCode,
                    street: a.street,
                }),
        );

        const contacts = record.contacts.getItems().map((c) => {
            const history = (c.history ?? []).map(
                (h) =>
                    new ContactHistoryEntry({
                        previousValue: h.previousValue,
                        changedAt: h.changedAt,
                    }),
            );

            const base = {
                type: c.type as ContactType,
                title: c.title,
                description: c.description ?? undefined,
                note: c.note ?? undefined,
                value: c.value,
                history,
            };

            if (c.type === ContactType.CUSTOM) {
                return new DomainCustomerContact({
                    ...base,
                    type: ContactType.CUSTOM,
                    customLabel: c.customLabel!,
                });
            }

            return new DomainCustomerContact(
                base as {
                    type: ContactType.EMAIL | ContactType.PHONE;
                    title: string;
                    value: string;
                    history: ContactHistoryEntry[];
                    description?: string;
                    note?: string;
                },
            );
        });

        return CustomerAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                customerType: record.customerType as CustomerType,
                description: record.description ?? undefined,
                note: record.note ?? undefined,
                firstName: record.firstName ?? undefined,
                lastName: record.lastName ?? undefined,
                companyName: record.companyName ?? undefined,
                nip: record.nip ?? undefined,
                addresses,
                contacts,
            },
        });
    }

    toPersistence(domain: CustomerAggregate): RequiredEntityData<Customer> {
        return {
            id: domain.id as string,
            name: domain.name,
            customerType: domain.customerType,
            description: domain.description,
            note: domain.note,
            firstName: domain.firstName,
            lastName: domain.lastName,
            companyName: domain.companyName,
            nip: domain.nip,
            addresses: domain.addresses.map((a) => ({
                label: a.label,
                note: a.note,
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
                note: c.note,
                customLabel: c.customLabel,
                value: c.value,
                history: c.history.map((h) => ({
                    previousValue: h.previousValue,
                    changedAt: h.changedAt,
                })),
            })) as RequiredEntityData<Customer>["contacts"],
        };
    }

    toResponse(customer: CustomerAggregate): GetCustomerResponse {
        return {
            id: customer.id,
            name: customer.name,
            customerType: customer.customerType,
            description: customer.description,
            note: customer.note,
            firstName: customer.firstName,
            lastName: customer.lastName,
            companyName: customer.companyName,
            nip: customer.nip,
            addresses: customer.addresses.map((a) => ({
                label: a.label,
                note: a.note,
                country: a.country,
                state: a.state,
                city: a.city,
                postalCode: a.postalCode,
                street: a.street,
            })),
            contacts: customer.contacts.map((c) => ({
                type: c.type,
                title: c.title,
                description: c.description,
                note: c.note,
                customLabel: c.customLabel,
                value: c.value,
                history: c.history.map((h) => ({
                    previousValue: h.previousValue,
                    changedAt: h.changedAt.toISOString(),
                })),
            })),
        };
    }
}
