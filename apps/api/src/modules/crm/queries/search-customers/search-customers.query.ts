import { Paginated } from "../../../../libs/ports/repository.port.js";
import { GetCustomerResponse } from "../../../../shared/queries/get-customer.query.js";

export interface SearchCustomersFilters {
    alsoSearchByDescription?: boolean;
    alsoSearchByAddress?: boolean;
    alsoSearchByEmail?: boolean;
    alsoSearchByPhone?: boolean;
}

export class SearchCustomersQuery {
    constructor(
        public readonly term: string,
        public readonly filters: SearchCustomersFilters = {},
        public readonly page: number = 1,
        public readonly limit: number = 20,
    ) {}
}

export type SearchCustomersResponse = Paginated<GetCustomerResponse>;
