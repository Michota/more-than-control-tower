import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { SectorAggregate } from "../domain/sector.aggregate.js";

export interface SectorRepositoryPort extends RepositoryPort<SectorAggregate> {
    findByWarehouseId(warehouseId: string): Promise<SectorAggregate[]>;
}
