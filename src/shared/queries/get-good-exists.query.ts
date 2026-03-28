/**
 * Cross-module read contract: Sales sends this query to verify a good
 * exists in the Warehouse module before assigning it to an order line.
 * Warehouse module registers the handler.
 */
export class GetGoodExistsQuery {
    constructor(public readonly goodId: string) {}
}

export type GetGoodExistsResponse = boolean;
