import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { StockEntryAggregate } from "../domain/stock-entry.aggregate.js";

export interface StockEntryRepositoryPort extends RepositoryPort<StockEntryAggregate> {
    findByGoodAndWarehouse(goodId: string, warehouseId: string): Promise<StockEntryAggregate | null>;
    findByWarehouse(warehouseId: string): Promise<StockEntryAggregate[]>;
    findBySector(sectorId: string): Promise<StockEntryAggregate[]>;
    findByGood(goodId: string): Promise<StockEntryAggregate[]>;
    findActiveByGoodId(goodId: string): Promise<StockEntryAggregate[]>;
}
