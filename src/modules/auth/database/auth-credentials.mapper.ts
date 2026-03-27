import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { AuthCredentialsAggregate } from "../domain/auth-credentials.aggregate.js";
import { AuthCredentials } from "./auth-credentials.entity.js";

@Injectable()
export class AuthCredentialsMapper {
    toDomain(record: AuthCredentials): AuthCredentialsAggregate {
        return AuthCredentialsAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                userId: record.systemUser.id,
                passwordHash: record.passwordHash,
            },
        });
    }

    toPersistence(domain: AuthCredentialsAggregate): RequiredEntityData<AuthCredentials> {
        return {
            id: domain.id as string,
            systemUser: domain.userId,
            passwordHash: domain.passwordHash,
        };
    }
}
