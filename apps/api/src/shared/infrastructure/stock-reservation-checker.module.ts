import { Global, Module } from "@nestjs/common";
import { STOCK_RESERVATION_CHECKERS } from "./stock-reservation-checker.js";
import { CanStockEntryBeModifiedQueryHandler } from "./stock-reservation-checker.query-handler.js";

/**
 * Global module that provides the CanStockEntryBeModifiedQuery handler.
 *
 * Modules that reserve stock entries should register their checkers
 * by adding a provider for STOCK_RESERVATION_CHECKERS token.
 * Use multi-provider pattern to register multiple checkers:
 *
 * ```ts
 * { provide: STOCK_RESERVATION_CHECKERS, useClass: MyChecker, multi: true }
 * ```
 *
 * If no checkers are registered, the handler allows all modifications.
 */
@Global()
@Module({
    providers: [
        CanStockEntryBeModifiedQueryHandler,
        {
            provide: STOCK_RESERVATION_CHECKERS,
            useValue: [],
        },
    ],
    exports: [STOCK_RESERVATION_CHECKERS],
})
export class StockReservationCheckerModule {}
