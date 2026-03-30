import { Inject, Injectable, Optional } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    CanStockEntryBeModifiedQuery,
    type CanStockEntryBeModifiedResponse,
} from "../queries/can-stock-entry-be-modified.query.js";
import { STOCK_RESERVATION_CHECKERS, type StockReservationChecker } from "./stock-reservation-checker.js";

@QueryHandler(CanStockEntryBeModifiedQuery)
@Injectable()
export class CanStockEntryBeModifiedQueryHandler implements IQueryHandler<
    CanStockEntryBeModifiedQuery,
    CanStockEntryBeModifiedResponse
> {
    constructor(
        @Optional()
        @Inject(STOCK_RESERVATION_CHECKERS)
        private readonly checkers: StockReservationChecker[] = [],
    ) {}

    async execute(query: CanStockEntryBeModifiedQuery): Promise<CanStockEntryBeModifiedResponse> {
        for (const checker of this.checkers) {
            const result = await checker.isStockEntryReserved(query.stockEntryId);

            if (result.reserved) {
                return { allowed: false, reason: result.reason };
            }
        }

        return { allowed: true };
    }
}
