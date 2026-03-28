import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { CodeRepositoryPort } from "../../database/code.repository.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { GoodNotFoundError } from "../../domain/good.errors.js";
import { CODE_REPOSITORY_PORT, GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import { ListCodesForGoodQuery, ListCodesForGoodResponse } from "./list-codes-for-good.query.js";

@QueryHandler(ListCodesForGoodQuery)
export class ListCodesForGoodQueryHandler implements IQueryHandler<ListCodesForGoodQuery, ListCodesForGoodResponse> {
    constructor(
        @Inject(CODE_REPOSITORY_PORT)
        private readonly codeRepo: CodeRepositoryPort,

        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,
    ) {}

    async execute(query: ListCodesForGoodQuery): Promise<ListCodesForGoodResponse> {
        const good = await this.goodRepo.findOneById(query.goodId);
        if (!good) {
            throw new GoodNotFoundError(query.goodId);
        }

        const codes = await this.codeRepo.findByGoodId(query.goodId);

        return codes.map((c) => ({
            id: c.id as string,
            type: c.type,
            value: c.value,
        }));
    }
}
