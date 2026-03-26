import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Paginated } from "../../../../libs/ports/repository.port.js";
import { SystemUserMapper } from "../../database/system-user.mapper.js";
import type { SystemUserRepositoryPort } from "../../database/system-user.repository.port.js";
import { SYSTEM_USER_REPOSITORY_PORT } from "../../system.di-tokens.js";
import { ListSystemUsersQuery, ListSystemUsersResponse } from "./list-system-users.query.js";

@QueryHandler(ListSystemUsersQuery)
export class ListSystemUsersQueryHandler implements IQueryHandler<ListSystemUsersQuery, ListSystemUsersResponse> {
    constructor(
        @Inject(SYSTEM_USER_REPOSITORY_PORT)
        private readonly userRepo: SystemUserRepositoryPort,
        private readonly mapper: SystemUserMapper,
    ) {}

    async execute(query: ListSystemUsersQuery): Promise<ListSystemUsersResponse> {
        if (query.term) {
            const { data, count } = await this.userRepo.search(query.term, {
                page: query.page,
                limit: query.limit,
            });

            return new Paginated({
                data: data.map((user) => this.mapper.toResponse(user)),
                count,
                page: query.page,
                limit: query.limit,
            });
        }

        const result = await this.userRepo.findAllPaginated({
            page: query.page,
            limit: query.limit,
            offset: (query.page - 1) * query.limit,
            orderBy: { field: "email", direction: "asc" },
        });

        return new Paginated({
            data: result.data.map((user) => this.mapper.toResponse(user)),
            count: result.count,
            page: query.page,
            limit: query.limit,
        });
    }
}
