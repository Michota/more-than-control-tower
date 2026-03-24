import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { GoodNotFoundError } from "../../domain/good.errors.js";
import { GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { GetGoodQuery, GoodResponse } from "./get-good.query.js";

@QueryHandler(GetGoodQuery)
export class GetGoodQueryHandler implements IQueryHandler<GetGoodQuery, GoodResponse> {
    constructor(
        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,
    ) {}

    async execute(query: GetGoodQuery): Promise<GoodResponse> {
        const good = await this.goodRepo.findOneById(query.goodId);
        if (!good) {
            throw new GoodNotFoundError(query.goodId);
        }

        return {
            id: good.id as string,
            name: good.name,
            description: good.description,
            weight: { value: good.weight.value, unit: good.weight.unit },
            dimensions: {
                length: good.dimensions.length,
                width: good.dimensions.width,
                height: good.dimensions.height,
                unit: good.dimensions.unit,
            },
            parentId: good.parentId,
        };
    }
}
