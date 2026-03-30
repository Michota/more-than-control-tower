/**
 * Cross-module read contract: CRM sends this query to retrieve orders linked to a customer.
 * Sales module registers the handler. If no handler is registered (module not loaded),
 * the caller should handle the error gracefully.
 */
export class GetCustomerOrdersQuery {
    constructor(public readonly customerId: string) {}
}

export interface CustomerOrderResponse {
    id: string;
    status: string;
    orderedAt: string;
    totalCost?: number;
    currency?: string;
}

export type GetCustomerOrdersResponse = CustomerOrderResponse[];
