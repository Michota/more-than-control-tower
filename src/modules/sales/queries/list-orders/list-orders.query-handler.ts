import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";
import { ListOrdersQuery, type ListOrdersResponse, type OrderListItem } from "./list-orders.query.js";

@QueryHandler(ListOrdersQuery)
export class ListOrdersQueryHandler implements IQueryHandler<ListOrdersQuery, ListOrdersResponse> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,
    ) {}

    async execute(query: ListOrdersQuery): Promise<ListOrdersResponse> {
        const result = await this.orderRepo.findFilteredPaginated({
            page: query.page,
            limit: query.limit,
            customerId: query.customerId,
            status: query.status,
        });

        return {
            ...result,
            data: result.data.map((order): OrderListItem => {
                const props = order.properties;
                return {
                    id: order.id as string,
                    customerId: props.customerId,
                    actorId: props.actorId,
                    source: props.source,
                    status: props.status,
                    cost: props.cost.amount.toNumber(),
                    currency: props.cost.currency.code,
                };
            }),
        };
    }
}
