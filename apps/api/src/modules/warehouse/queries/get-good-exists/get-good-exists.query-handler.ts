import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetGoodExistsQuery, type GetGoodExistsResponse } from "../../../../shared/queries/get-good-exists.query.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";

@QueryHandler(GetGoodExistsQuery)
export class GetGoodExistsQueryHandler implements IQueryHandler<GetGoodExistsQuery, GetGoodExistsResponse> {
    constructor(
        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,
    ) {}

    async execute(query: GetGoodExistsQuery): Promise<GetGoodExistsResponse> {
        const good = await this.goodRepo.findOneById(query.goodId);
        return good !== null;
    }
}
