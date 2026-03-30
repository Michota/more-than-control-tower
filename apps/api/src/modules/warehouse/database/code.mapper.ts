import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { CodeAggregate } from "../domain/code.aggregate.js";
import { CodeType } from "../domain/code-type.enum.js";
import { Code } from "./code.entity.js";

@Injectable()
export class CodeMapper implements Mapper<CodeAggregate, RequiredEntityData<Code>> {
    toDomain(record: Code): CodeAggregate {
        return CodeAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                goodId: record.goodId,
                type: record.type as CodeType,
                value: record.value,
            },
        });
    }

    toPersistence(domain: CodeAggregate): RequiredEntityData<Code> {
        return {
            id: domain.id as string,
            goodId: domain.goodId,
            type: domain.type,
            value: domain.value,
        };
    }

    toResponse(entity: CodeAggregate): unknown {
        return entity.toJSON();
    }
}
