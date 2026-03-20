import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { CustomerRepositoryPort } from "../../../infrastructure/customer.repository.port.js";
import { CUSTOMER_REPOSITORY_PORT } from "../../ports/tokens.js";
import { SearchCustomersQuery, SearchCustomersResponse } from "./search-customers.query.js";

@QueryHandler(SearchCustomersQuery)
export class SearchCustomersQueryHandler implements IQueryHandler<SearchCustomersQuery, SearchCustomersResponse> {
    constructor(
        @Inject(CUSTOMER_REPOSITORY_PORT)
        private readonly customerRepo: CustomerRepositoryPort,
    ) {}

    async execute(query: SearchCustomersQuery): Promise<SearchCustomersResponse> {
        const customers = await this.customerRepo.search(query.term, query.filters);

        return customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            description: customer.description,
            addresses: customer.addresses,
            contacts: customer.contacts,
        }));
    }
}
