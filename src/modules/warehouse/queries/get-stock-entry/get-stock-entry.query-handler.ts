import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetStockEntryQuery, type GetStockEntryResponse } from "../../../../shared/queries/get-stock-entry.query.js";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";

@QueryHandler(GetStockEntryQuery)
export class GetStockEntryQueryHandler implements IQueryHandler<GetStockEntryQuery, GetStockEntryResponse> {
    constructor(
        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockEntryRepo: StockEntryRepositoryPort,
    ) {}

    async execute(query: GetStockEntryQuery): Promise<GetStockEntryResponse> {
        const entry = await this.stockEntryRepo.findOneById(query.stockEntryId);

        if (!entry) {
            return null;
        }

        return {
            id: entry.id as string,
            goodId: entry.goodId,
            warehouseId: entry.warehouseId,
            quantity: entry.quantity,
        };
    }
}
