import { ContactType } from "../../domain/customer-contact-type.enum.js";

export interface CreateCustomerAddressDto {
    label?: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    street: string;
}

export interface CreateCustomerContactDto {
    type: ContactType;
    title: string;
    description?: string;
    value: string;
}

export interface CreateCustomerDto {
    name: string;
    description?: string;
    addresses: CreateCustomerAddressDto[];
    contacts: CreateCustomerContactDto[];
}
