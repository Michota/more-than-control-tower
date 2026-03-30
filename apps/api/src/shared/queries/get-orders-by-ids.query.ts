/**
 * Cross-module read contract: any module needing order line details
 * for a batch of orders sends this query. Sales module registers the handler.
 *
 * Example: Freight asks "what stock entries are needed for these orders?"
 * to build a loading plan for a journey.
 */
export class GetOrdersByIdsQuery {
    constructor(public readonly orderIds: string[]) {}
}

export interface OrderLineStockInfo {
    productId: string;
    quantity: number;
    stockEntryId?: string;
}

export interface OrderWithLinesResponse {
    id: string;
    customerId: string;
    status: string;
    orderLines: OrderLineStockInfo[];
}

export type GetOrdersByIdsResponse = OrderWithLinesResponse[];
