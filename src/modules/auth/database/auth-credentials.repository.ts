import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { AuthCredentialsAggregate } from "../domain/auth-credentials.aggregate.js";
import { AuthCredentialsRepositoryPort } from "./auth-credentials.repository.port.js";
import { AuthCredentials } from "./auth-credentials.entity.js";
import { AuthCredentialsMapper } from "./auth-credentials.mapper.js";

@Injectable()
export class AuthCredentialsRepository implements AuthCredentialsRepositoryPort {
    private readonly mapper = new AuthCredentialsMapper();

    constructor(private readonly em: EntityManager) {}

    async findByUserId(userId: string): Promise<AuthCredentialsAggregate | null> {
        const record = await this.em.findOne(AuthCredentials, { userId });
        return record ? this.mapper.toDomain(record) : null;
    }

    async save(credentials: AuthCredentialsAggregate): Promise<void> {
        await this.em.upsert(AuthCredentials, this.mapper.toPersistence(credentials));
    }
}
