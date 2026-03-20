/**
 * Cross-module read contract: any module needing customer data sends this query.
 * CRM module registers the handler. Callers have no dependency on CRM internals.
 */
export class GetCustomerQuery {
    constructor(public readonly customerId: string) {}
}

export interface GetCustomerContactResponse {
    type: "phone" | "email";
    title: string;
    description?: string;
    value: string;
}

export interface GetCustomerAddressResponse {
    label?: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    street: string;
}

export interface GetCustomerResponse {
    id: string;
    name: string;
    description?: string;
    addresses: GetCustomerAddressResponse[];
    contacts: GetCustomerContactResponse[];
}
