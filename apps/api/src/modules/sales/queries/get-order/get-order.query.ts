import { Query } from "@nestjs/cqrs";

export interface OrderLineResponse {
    productId: string;
    quantity: number;
    goodId?: string;
    stockEntryId?: string;
}

export interface OrderResponse {
    id: string;
    customerId: string;
    actorId: string;
    source: string;
    status: string;
    cost: number;
    currency: string;
    orderLines: OrderLineResponse[];
}

export class GetOrderQuery extends Query<OrderResponse> {
    constructor(public readonly orderId: string) {
        super();
    }
}
