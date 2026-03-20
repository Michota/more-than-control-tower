import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { CustomerAggregate } from "../domain/customer.aggregate.js";

export interface CustomerRepositoryPort extends RepositoryPort<CustomerAggregate> {
    search(
        term: string,
        filters?: {
            alsoSearchByDescription?: boolean;
            alsoSearchByAddress?: boolean;
            alsoSearchByEmail?: boolean;
            alsoSearchByPhone?: boolean;
        },
    ): Promise<CustomerAggregate[]>;
}
