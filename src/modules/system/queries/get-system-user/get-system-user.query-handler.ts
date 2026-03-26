import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";
import { SystemUserMapper } from "../../database/system-user.mapper.js";
import type { SystemUserRepositoryPort } from "../../database/system-user.repository.port.js";
import { SYSTEM_USER_REPOSITORY_PORT } from "../../system.di-tokens.js";

@QueryHandler(GetSystemUserQuery)
export class GetSystemUserQueryHandler implements IQueryHandler<GetSystemUserQuery, GetSystemUserResponse | null> {
    constructor(
        @Inject(SYSTEM_USER_REPOSITORY_PORT)
        private readonly userRepo: SystemUserRepositoryPort,
        private readonly mapper: SystemUserMapper,
    ) {}

    async execute(query: GetSystemUserQuery): Promise<GetSystemUserResponse | null> {
        const user = await this.userRepo.findOneById(query.userId);
        if (!user) {
            return null;
        }

        return this.mapper.toResponse(user);
    }
}
