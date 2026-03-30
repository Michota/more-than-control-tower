import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { GetSystemUserResponse } from "../../../shared/queries/get-system-user.query.js";
import { SystemUserRole } from "../domain/system-user-role.enum.js";
import { SystemUserStatus } from "../domain/system-user-status.enum.js";
import { SystemUserAggregate } from "../domain/system-user.aggregate.js";
import { SystemUser } from "./system-user.entity.js";

@Injectable()
export class SystemUserMapper implements Mapper<
    SystemUserAggregate,
    RequiredEntityData<SystemUser>,
    GetSystemUserResponse
> {
    toDomain(record: SystemUser): SystemUserAggregate {
        return SystemUserAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                email: record.email,
                name: record.name,
                roles: record.roles as SystemUserRole[],
                status: record.status as SystemUserStatus,
            },
        });
    }

    toPersistence(domain: SystemUserAggregate): RequiredEntityData<SystemUser> {
        return {
            id: domain.id as string,
            email: domain.email,
            name: domain.name,
            roles: domain.roles,
            status: domain.status,
        };
    }

    toResponse(domain: SystemUserAggregate): GetSystemUserResponse {
        return {
            id: domain.id,
            email: domain.email,
            name: domain.name,
            roles: domain.roles,
            status: domain.status,
        };
    }
}
