import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    GetOrdersByIdsQuery,
    type GetOrdersByIdsResponse,
    type OrderWithLinesResponse,
} from "../../../../shared/queries/get-orders-by-ids.query.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";

@QueryHandler(GetOrdersByIdsQuery)
export class GetOrdersByIdsQueryHandler implements IQueryHandler<GetOrdersByIdsQuery, GetOrdersByIdsResponse> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,
    ) {}

    async execute(query: GetOrdersByIdsQuery): Promise<GetOrdersByIdsResponse> {
        const orders = await Promise.all(query.orderIds.map((id) => this.orderRepo.findOneById(id)));

        return orders
            .filter((order): order is NonNullable<typeof order> => order !== null)
            .map((order): OrderWithLinesResponse => {
                const props = order.properties;
                return {
                    id: order.id as string,
                    customerId: props.customerId,
                    status: props.status,
                    orderLines: Array.from(props.orderLines.getLines().entries()).map(([productId, line]) => ({
                        productId: productId as string,
                        quantity: line.quantity,
                        stockEntryId: line.stockEntryId,
                    })),
                };
            });
    }
}
