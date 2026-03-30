import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryBus, QueryHandler } from "@nestjs/cqrs";
import { GetOrdersByIdsQuery, GetOrdersByIdsResponse } from "../../../../shared/queries/get-orders-by-ids.query.js";
import { GetStockEntryQuery, GetStockEntryResponse } from "../../../../shared/queries/get-stock-entry.query.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import type { VehicleRepositoryPort } from "../../database/vehicle.repository.port.js";
import { JourneyNotFoundError } from "../../domain/journey.errors.js";
import { JOURNEY_REPOSITORY_PORT, VEHICLE_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import {
    GetJourneyLoadingPlanQuery,
    GetJourneyLoadingPlanResponse,
    LoadingPlanItem,
} from "./get-journey-loading-plan.query.js";

@QueryHandler(GetJourneyLoadingPlanQuery)
export class GetJourneyLoadingPlanQueryHandler implements IQueryHandler<
    GetJourneyLoadingPlanQuery,
    GetJourneyLoadingPlanResponse
> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        @Inject(VEHICLE_REPOSITORY_PORT)
        private readonly vehicleRepo: VehicleRepositoryPort,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: GetJourneyLoadingPlanQuery): Promise<GetJourneyLoadingPlanResponse> {
        const journey = await this.journeyRepo.findOneById(query.journeyId);
        if (!journey) {
            throw new JourneyNotFoundError(query.journeyId);
        }

        // Resolve vehicle's warehouse (target for loading)
        let targetWarehouseId: string | undefined;
        if (journey.vehicleIds.length > 0) {
            const vehicle = await this.vehicleRepo.findOneById(journey.vehicleIds[0]);
            targetWarehouseId = vehicle?.warehouseId;
        }

        // Collect all orderIds from stops
        const allOrderIds = journey.stops.flatMap((s) => s.orderIds);
        if (allOrderIds.length === 0) {
            return { journeyId: query.journeyId, targetWarehouseId, items: [], unassignedOrderLines: [] };
        }

        // Build customerId lookup from stops
        const orderToCustomer = new Map<string, string>();
        for (const stop of journey.stops) {
            for (const orderId of stop.orderIds) {
                orderToCustomer.set(orderId, stop.customerId);
            }
        }

        // Fetch orders with their lines
        const orders = await this.queryBus.execute<GetOrdersByIdsQuery, GetOrdersByIdsResponse>(
            new GetOrdersByIdsQuery(allOrderIds),
        );

        const items: LoadingPlanItem[] = [];
        const unassignedOrderLines: { orderId: string; productId: string; quantity: number }[] = [];

        for (const order of orders) {
            for (const line of order.orderLines) {
                if (line.stockEntryId) {
                    // Fetch stock entry details to get goodId and source warehouse
                    const stockEntry = await this.queryBus.execute<GetStockEntryQuery, GetStockEntryResponse>(
                        new GetStockEntryQuery(line.stockEntryId),
                    );

                    if (stockEntry) {
                        items.push({
                            stockEntryId: line.stockEntryId,
                            goodId: stockEntry.goodId,
                            quantity: line.quantity,
                            sourceWarehouseId: stockEntry.warehouseId,
                            orderId: order.id,
                            customerId: orderToCustomer.get(order.id) ?? order.customerId,
                        });
                    }
                } else {
                    unassignedOrderLines.push({
                        orderId: order.id,
                        productId: line.productId,
                        quantity: line.quantity,
                    });
                }
            }
        }

        return {
            journeyId: query.journeyId,
            targetWarehouseId,
            items,
            unassignedOrderLines,
        };
    }
}
