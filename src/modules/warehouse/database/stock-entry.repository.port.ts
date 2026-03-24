import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { StockEntryAggregate } from "../domain/stock-entry.aggregate.js";

export interface StockEntryRepositoryPort extends RepositoryPort<StockEntryAggregate> {
    findByGoodAndWarehouse(goodId: string, warehouseId: string): Promise<StockEntryAggregate | null>;
    findByWarehouse(warehouseId: string): Promise<StockEntryAggregate[]>;
}
