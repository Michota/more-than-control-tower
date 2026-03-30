import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { CodeRepositoryPort } from "../../database/code.repository.port.js";
import type { GoodRepositoryPort } from "../../database/good.repository.port.js";
import { CodeNotFoundError } from "../../domain/code.errors.js";
import { GoodNotFoundError } from "../../domain/good.errors.js";
import { CODE_REPOSITORY_PORT, GOOD_REPOSITORY_PORT } from "../../warehouse.di-tokens.js";
import {
    FindGoodByCodeQuery,
    type FindGoodByCodeResponse,
} from "../../../../shared/queries/find-good-by-code.query.js";

@QueryHandler(FindGoodByCodeQuery)
export class FindGoodByCodeQueryHandler implements IQueryHandler<FindGoodByCodeQuery, FindGoodByCodeResponse> {
    constructor(
        @Inject(CODE_REPOSITORY_PORT)
        private readonly codeRepo: CodeRepositoryPort,

        @Inject(GOOD_REPOSITORY_PORT)
        private readonly goodRepo: GoodRepositoryPort,
    ) {}

    async execute(query: FindGoodByCodeQuery): Promise<FindGoodByCodeResponse> {
        const code = await this.codeRepo.findByValue(query.value);
        if (!code) {
            throw new CodeNotFoundError(query.value);
        }

        const good = await this.goodRepo.findOneById(code.goodId);
        if (!good) {
            throw new GoodNotFoundError(code.goodId);
        }

        return {
            goodId: good.id as string,
            goodName: good.name,
            codeId: code.id as string,
            codeType: code.type,
            codeValue: code.value,
        };
    }
}
