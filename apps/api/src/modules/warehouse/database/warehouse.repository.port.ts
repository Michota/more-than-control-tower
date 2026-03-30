import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { WarehouseAggregate } from "../domain/warehouse.aggregate.js";

export interface WarehouseRepositoryPort extends RepositoryPort<WarehouseAggregate> {}
