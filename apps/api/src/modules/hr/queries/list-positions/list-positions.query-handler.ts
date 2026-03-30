import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { PositionRepositoryPort } from "../../database/position.repository.port.js";
import { PositionMapper, PositionResponse } from "../../database/position.mapper.js";
import { POSITION_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { ListPositionsQuery } from "./list-positions.query.js";

export interface ListPositionsResponse {
    positions: PositionResponse[];
}

@QueryHandler(ListPositionsQuery)
export class ListPositionsQueryHandler implements IQueryHandler<ListPositionsQuery, ListPositionsResponse> {
    constructor(
        @Inject(POSITION_REPOSITORY_PORT)
        private readonly positionRepo: PositionRepositoryPort,
        private readonly mapper: PositionMapper,
    ) {}

    async execute(query: ListPositionsQuery): Promise<ListPositionsResponse> {
        void query;
        const positions = await this.positionRepo.findAll();
        return { positions: positions.map((p) => this.mapper.toResponse(p)) };
    }
}
