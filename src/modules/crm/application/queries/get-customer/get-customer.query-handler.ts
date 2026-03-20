import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetCustomerQuery, GetCustomerResponse } from "../../../../../shared/queries/get-customer.query.js";
import type { CustomerRepositoryPort } from "../../../infrastructure/customer.repository.port.js";
import { CUSTOMER_REPOSITORY_PORT } from "../../ports/tokens.js";

@QueryHandler(GetCustomerQuery)
export class GetCustomerQueryHandler implements IQueryHandler<GetCustomerQuery, GetCustomerResponse | null> {
    constructor(
        @Inject(CUSTOMER_REPOSITORY_PORT)
        private readonly customerRepo: CustomerRepositoryPort,
    ) {}

    async execute(query: GetCustomerQuery): Promise<GetCustomerResponse | null> {
        const customer = await this.customerRepo.findOneById(query.customerId);
        if (!customer) {
            return null;
        }

        return {
            id: customer.id,
            name: customer.name,
            description: customer.description,
            addresses: customer.addresses,
            contacts: customer.contacts,
        };
    }
}
