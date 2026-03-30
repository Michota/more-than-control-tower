import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { PositionAggregate } from "../domain/position.aggregate.js";

export interface PositionRepositoryPort extends RepositoryPort<PositionAggregate> {
    findByKey(key: string): Promise<PositionAggregate | null>;
    existsByKey(key: string): Promise<boolean>;
}
