import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import type { QualificationSchemaEntry } from "../../../shared/positions/position.types.js";
import { PositionAggregate } from "../domain/position.aggregate.js";
import { Position } from "./position.entity.js";

export interface PositionResponse {
    id: string;
    key: string;
    displayName: string;
    qualificationSchema: QualificationSchemaEntry[];
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
                qualificationSchema: record.qualificationSchema as QualificationSchemaEntry[],
                permissionKeys: record.permissionKeys as string[],
            },
        });
    }

    toPersistence(domain: PositionAggregate): RequiredEntityData<Position> {
        return {
            id: domain.id as string,
            key: domain.key,
            displayName: domain.displayName,
            qualificationSchema: domain.qualificationSchema,
            permissionKeys: domain.permissionKeys,
        };
    }

    toResponse(position: PositionAggregate): PositionResponse {
        return {
            id: position.id as string,
            key: position.key,
            displayName: position.displayName,
            qualificationSchema: position.qualificationSchema,
            permissionKeys: position.permissionKeys,
        };
    }
}
