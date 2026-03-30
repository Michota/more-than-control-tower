import { Query } from "@nestjs/cqrs";
import { Paginated } from "../../../../libs/ports/repository.port.js";

export interface OrderListItem {
    id: string;
    customerId: string;
    actorId: string;
    source: string;
    status: string;
    cost: number;
    currency: string;
}

export type ListOrdersResponse = Paginated<OrderListItem>;

export class ListOrdersQuery extends Query<ListOrdersResponse> {
    constructor(
        public readonly page: number,
        public readonly limit: number,
        public readonly customerId?: string,
        public readonly status?: string,
        public readonly search?: string,
    ) {
        super();
    }
}
