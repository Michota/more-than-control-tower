/**
 * Cross-module read contract: any module needing customer data sends this query.
 * CRM module registers the handler. Callers have no dependency on CRM internals.
 */
export class GetCustomerQuery {
    constructor(public readonly customerId: string) {}
}

export interface GetCustomerContactHistoryResponse {
    previousValue: string;
    changedAt: string;
}

export interface GetCustomerContactResponse {
    type: "phone" | "email" | "custom";
    title: string;
    description?: string;
    note?: string;
    customLabel?: string;
    value: string;
    history: GetCustomerContactHistoryResponse[];
}

export interface GetCustomerAddressResponse {
    label?: string;
    note?: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    street: string;
}

export interface GetCustomerResponse {
    id: string;
    name: string;
    customerType: string;
    description?: string;
    note?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    nip?: string;
    addresses: GetCustomerAddressResponse[];
    contacts: GetCustomerContactResponse[];
}
