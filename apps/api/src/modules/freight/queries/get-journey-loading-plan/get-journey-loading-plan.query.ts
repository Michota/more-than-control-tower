import { Query } from "@nestjs/cqrs";

export interface LoadingPlanItem {
    stockEntryId: string;
    goodId: string;
    quantity: number;
    sourceWarehouseId: string;
    orderId: string;
    customerId: string;
}

export interface GetJourneyLoadingPlanResponse {
    journeyId: string;
    targetWarehouseId?: string;
    items: LoadingPlanItem[];
    unassignedOrderLines: {
        orderId: string;
        productId: string;
        quantity: number;
    }[];
}

export class GetJourneyLoadingPlanQuery extends Query<GetJourneyLoadingPlanResponse> {
    constructor(public readonly journeyId: string) {
        super();
    }
}
