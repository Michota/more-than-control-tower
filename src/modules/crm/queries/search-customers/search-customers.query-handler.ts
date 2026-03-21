import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Paginated } from "../../../../libs/ports/repository.port.js";
import type { CustomerRepositoryPort } from "../../database/customer.repository.port.js";
import { CUSTOMER_REPOSITORY_PORT } from "../../crm.di-tokens.js";
import { SearchCustomersQuery, SearchCustomersResponse } from "./search-customers.query.js";

@QueryHandler(SearchCustomersQuery)
export class SearchCustomersQueryHandler implements IQueryHandler<SearchCustomersQuery, SearchCustomersResponse> {
    constructor(
        @Inject(CUSTOMER_REPOSITORY_PORT)
        private readonly customerRepo: CustomerRepositoryPort,
    ) {}

    async execute(query: SearchCustomersQuery): Promise<SearchCustomersResponse> {
        const { data, count } = await this.customerRepo.search(query.term, query.filters, {
            page: query.page,
            limit: query.limit,
        });

        return new Paginated({
            data,
            count,
            page: query.page,
            limit: query.limit,
        });
    }
}
