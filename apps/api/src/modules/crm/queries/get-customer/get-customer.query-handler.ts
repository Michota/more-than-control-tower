import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetCustomerQuery, GetCustomerResponse } from "../../../../shared/queries/get-customer.query.js";
import { CustomerMapper } from "../../database/customer.mapper.js";
import type { CustomerRepositoryPort } from "../../database/customer.repository.port.js";
import { CUSTOMER_REPOSITORY_PORT } from "../../crm.di-tokens.js";

@QueryHandler(GetCustomerQuery)
export class GetCustomerQueryHandler implements IQueryHandler<GetCustomerQuery, GetCustomerResponse | null> {
    constructor(
        @Inject(CUSTOMER_REPOSITORY_PORT)
        private readonly customerRepo: CustomerRepositoryPort,
        private readonly mapper: CustomerMapper,
    ) {}

    async execute(query: GetCustomerQuery): Promise<GetCustomerResponse | null> {
        const customer = await this.customerRepo.findOneById(query.customerId);
        if (!customer) {
            return null;
        }

        return this.mapper.toResponse(customer);
    }
}
