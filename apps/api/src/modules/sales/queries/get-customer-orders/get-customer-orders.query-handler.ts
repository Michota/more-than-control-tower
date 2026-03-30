import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    GetCustomerOrdersQuery,
    type CustomerOrderResponse,
    type GetCustomerOrdersResponse,
} from "../../../../shared/queries/get-customer-orders.query.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";

@QueryHandler(GetCustomerOrdersQuery)
export class GetCustomerOrdersQueryHandler implements IQueryHandler<GetCustomerOrdersQuery, GetCustomerOrdersResponse> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,
    ) {}

    async execute(query: GetCustomerOrdersQuery): Promise<GetCustomerOrdersResponse> {
        const orders = await this.orderRepo.findByCustomerId(query.customerId);

        return orders.map((order): CustomerOrderResponse => {
            const props = order.properties;
            return {
                id: order.id as string,
                status: props.status,
                orderedAt: order.createdAt.toISOString(),
                totalCost: props.cost.amount.toNumber(),
                currency: props.cost.currency.code,
            };
        });
    }
}
