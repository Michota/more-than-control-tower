import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { StockEntryRepositoryPort } from "../../database/stock-entry.repository.port.js";
import { STOCK_ENTRY_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ListWarehouseStockQuery, ListWarehouseStockResponse } from "./list-warehouse-stock.query.js";

@QueryHandler(ListWarehouseStockQuery)
export class ListWarehouseStockQueryHandler implements IQueryHandler<
    ListWarehouseStockQuery,
    ListWarehouseStockResponse
> {
    constructor(
        @Inject(STOCK_ENTRY_REPOSITORY_PORT)
        private readonly stockRepo: StockEntryRepositoryPort,
    ) {}

    async execute(query: ListWarehouseStockQuery): Promise<ListWarehouseStockResponse> {
        const entries = await this.stockRepo.findByWarehouse(query.warehouseId);

        return entries.map((e) => ({
            id: e.id as string,
            goodId: e.properties.goodId,
            quantity: e.properties.quantity,
            sectorId: e.properties.sectorId,
        }));
    }
}
