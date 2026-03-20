import { GetCustomerResponse } from "../../../../../shared/queries/get-customer.query.js";

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
    ) {}
}

export type SearchCustomersResponse = GetCustomerResponse[];
