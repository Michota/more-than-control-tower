import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { OrderNotFoundError } from "../../domain/order.errors.js";
import type { OrderRepositoryPort } from "../../database/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../../sales.di-tokens.js";
import { GetOrderQuery, type OrderResponse } from "./get-order.query.js";

@QueryHandler(GetOrderQuery)
export class GetOrderQueryHandler implements IQueryHandler<GetOrderQuery, OrderResponse> {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,
    ) {}

    async execute(query: GetOrderQuery): Promise<OrderResponse> {
        const order = await this.orderRepo.findOneById(query.orderId);

        if (!order) {
            throw new OrderNotFoundError(query.orderId);
        }

        const props = order.properties;

        return {
            id: order.id as string,
            customerId: props.customerId,
            actorId: props.actorId,
            source: props.source,
            status: props.status,
            cost: props.cost.amount.toNumber(),
            currency: props.cost.currency.code,
            orderLines: Array.from(props.orderLines.getLines().entries()).map(([productId, line]) => ({
                productId: productId as string,
                quantity: line.quantity,
                goodId: line.goodId,
                stockEntryId: line.stockEntryId,
            })),
        };
    }
}
