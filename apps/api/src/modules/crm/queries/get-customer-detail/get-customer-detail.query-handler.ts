import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryBus, QueryHandler } from "@nestjs/cqrs";
import {
    GetCustomerInvoicesQuery,
    GetCustomerInvoicesResponse,
} from "../../../../shared/queries/get-customer-invoices.query.js";
import {
    GetCustomerOrdersQuery,
    GetCustomerOrdersResponse,
} from "../../../../shared/queries/get-customer-orders.query.js";
import { CustomerMapper } from "../../database/customer.mapper.js";
import type { CustomerRepositoryPort } from "../../database/customer.repository.port.js";
import { CUSTOMER_REPOSITORY_PORT } from "../../crm.di-tokens.js";
import { GetCustomerDetailQuery, GetCustomerDetailResponse } from "./get-customer-detail.query.js";

@QueryHandler(GetCustomerDetailQuery)
export class GetCustomerDetailQueryHandler implements IQueryHandler<
    GetCustomerDetailQuery,
    GetCustomerDetailResponse | null
> {
    constructor(
        @Inject(CUSTOMER_REPOSITORY_PORT)
        private readonly customerRepo: CustomerRepositoryPort,
        private readonly mapper: CustomerMapper,
        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: GetCustomerDetailQuery): Promise<GetCustomerDetailResponse | null> {
        const customer = await this.customerRepo.findOneById(query.customerId);
        if (!customer) {
            return null;
        }

        const baseResponse = this.mapper.toResponse(customer);

        const [invoices, orders] = await Promise.all([
            this.fetchInvoices(query.customerId),
            this.fetchOrders(query.customerId),
        ]);

        return {
            ...baseResponse,
            invoices,
            orders,
        };
    }

    private async fetchInvoices(customerId: string): Promise<GetCustomerInvoicesResponse | undefined> {
        try {
            return await this.queryBus.execute(new GetCustomerInvoicesQuery(customerId));
        } catch {
            return undefined;
        }
    }

    private async fetchOrders(customerId: string): Promise<GetCustomerOrdersResponse | undefined> {
        try {
            return await this.queryBus.execute(new GetCustomerOrdersQuery(customerId));
        } catch {
            return undefined;
        }
    }
}
