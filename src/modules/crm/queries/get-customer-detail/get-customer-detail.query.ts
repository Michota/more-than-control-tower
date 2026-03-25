import { GetCustomerResponse } from "../../../../shared/queries/get-customer.query.js";
import { GetCustomerInvoicesResponse } from "../../../../shared/queries/get-customer-invoices.query.js";
import { GetCustomerOrdersResponse } from "../../../../shared/queries/get-customer-orders.query.js";

export class GetCustomerDetailQuery {
    constructor(public readonly customerId: string) {}
}

export interface GetCustomerDetailResponse extends GetCustomerResponse {
    invoices?: GetCustomerInvoicesResponse;
    orders?: GetCustomerOrdersResponse;
}
