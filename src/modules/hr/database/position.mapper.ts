import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { PositionAggregate } from "../domain/position.aggregate.js";
import { Position } from "./position.entity.js";

export interface PositionResponse {
    id: string;
    key: string;
    displayName: string;
    permissionKeys: string[];
}

@Injectable()
export class PositionMapper implements Mapper<PositionAggregate, RequiredEntityData<Position>, PositionResponse> {
    toDomain(record: Position): PositionAggregate {
        return PositionAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                key: record.key,
                displayName: record.displayName,
                permissionKeys: record.permissionKeys as string[],
            },
        });
    }

    toPersistence(domain: PositionAggregate): RequiredEntityData<Position> {
        return {
            id: domain.id as string,
            key: domain.key,
            displayName: domain.displayName,
            permissionKeys: domain.permissionKeys,
        };
    }

    toResponse(position: PositionAggregate): PositionResponse {
        return {
            id: position.id as string,
            key: position.key,
            displayName: position.displayName,
            permissionKeys: position.permissionKeys,
        };
    }
}
