import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ListGoodsQuery, ListGoodsResponse } from "./list-goods.query.js";

@QueryHandler(ListGoodsQuery)
export class ListGoodsQueryHandler implements IQueryHandler<ListGoodsQuery, ListGoodsResponse> {
    constructor(
        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,
    ) {}

    async execute(query: ListGoodsQuery): Promise<ListGoodsResponse> {
        const result = await this.goodRepo.findPaginated({
            name: query.name,
            page: query.page,
            limit: query.limit,
        });

        return {
            ...result,
            data: result.data.map((g) => ({
                id: g.id as string,
                name: g.name,
                description: g.description,
                weight: { value: g.weight.value, unit: g.weight.unit },
                dimensions: {
                    length: g.dimensions.length,
                    width: g.dimensions.width,
                    height: g.dimensions.height,
                    unit: g.dimensions.unit,
                },
                parentId: g.parentId,
            })),
        };
    }
}
