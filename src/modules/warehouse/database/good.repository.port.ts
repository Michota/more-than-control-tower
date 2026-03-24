import { Paginated } from "../../../libs/ports/repository.port.js";
import { RepositoryPort } from "../../../libs/ports/repository.port.js";
import { GoodAggregate } from "../domain/good.aggregate.js";

export interface FindGoodsParams {
    name?: string;
    page: number;
    limit: number;
}

export interface GoodRepositoryPort extends RepositoryPort<GoodAggregate> {
    findPaginated(params: FindGoodsParams): Promise<Paginated<GoodAggregate>>;
}
