/**
 * Cross-module read contract: CRM sends this query to retrieve invoices linked to a customer.
 * Accountancy module registers the handler. If no handler is registered (module not loaded),
 * the caller should handle the error gracefully.
 */
export class GetCustomerInvoicesQuery {
    constructor(public readonly customerId: string) {}
}

export interface CustomerInvoiceResponse {
    id: string;
    status: string;
    issuedAt: string;
    dueDate: string;
    totalAmount?: number;
    currency?: string;
}

export type GetCustomerInvoicesResponse = CustomerInvoiceResponse[];
