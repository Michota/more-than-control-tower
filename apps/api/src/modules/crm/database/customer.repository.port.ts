import { PaginationParameters } from "src/libs/types/pagination.js";
import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { ContactHistoryEntry } from "../domain/contact-history-entry.value-object.js";
import { CustomerAggregate } from "../domain/customer.aggregate.js";

export interface PersistedContactSnapshot {
    id: string;
    value: string;
    history: ContactHistoryEntry[];
}

export interface CustomerRepositoryPort extends RepositoryPort<CustomerAggregate> {
    search(
        term: string,
        filters?: {
            alsoSearchByDescription?: boolean;
            alsoSearchByAddress?: boolean;
            alsoSearchByEmail?: boolean;
            alsoSearchByPhone?: boolean;
        },
        pagination?: PaginationParameters,
    ): Promise<{ data: CustomerAggregate[]; count: number }>;

    findContactSnapshots(customerId: string): Promise<PersistedContactSnapshot[]>;
}
