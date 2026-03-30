import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    GetSystemUserByEmailQuery,
    GetSystemUserByEmailResponse,
} from "../../../../shared/queries/get-system-user-by-email.query.js";
import { SystemUserMapper } from "../../database/system-user.mapper.js";
import type { SystemUserRepositoryPort } from "../../database/system-user.repository.port.js";
import { SYSTEM_USER_REPOSITORY_PORT } from "../../system.di-tokens.js";

@QueryHandler(GetSystemUserByEmailQuery)
export class GetSystemUserByEmailQueryHandler implements IQueryHandler<
    GetSystemUserByEmailQuery,
    GetSystemUserByEmailResponse
> {
    constructor(
        @Inject(SYSTEM_USER_REPOSITORY_PORT)
        private readonly userRepo: SystemUserRepositoryPort,
        private readonly mapper: SystemUserMapper,
    ) {}

    async execute(query: GetSystemUserByEmailQuery): Promise<GetSystemUserByEmailResponse> {
        const user = await this.userRepo.findByEmail(query.email);
        if (!user) {
            return null;
        }

        return this.mapper.toResponse(user);
    }
}
