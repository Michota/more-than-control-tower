import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { GoodAggregate } from "../domain/good.aggregate.js";

export interface GoodRepositoryPort extends RepositoryPort<GoodAggregate> {
    findByWarehouseId(warehouseId: string): Promise<GoodAggregate[]>;
}
