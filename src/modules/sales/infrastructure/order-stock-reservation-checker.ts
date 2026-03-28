import { Inject, Injectable } from "@nestjs/common";
import type { StockReservationChecker } from "../../../shared/infrastructure/stock-reservation-checker.js";
import type { OrderRepositoryPort } from "../database/order.repository.port.js";
import { ORDER_REPOSITORY_PORT } from "../sales.di-tokens.js";

@Injectable()
export class OrderStockReservationChecker implements StockReservationChecker {
    constructor(
        @Inject(ORDER_REPOSITORY_PORT)
        private readonly orderRepo: OrderRepositoryPort,
    ) {}

    async isStockEntryReserved(stockEntryId: string): Promise<{ reserved: boolean; reason?: string }> {
        const assigned = await this.orderRepo.isStockEntryAssigned(stockEntryId);

        if (assigned) {
            return { reserved: true, reason: "Stock entry is assigned to an active order." };
        }

        return { reserved: false };
    }
}
