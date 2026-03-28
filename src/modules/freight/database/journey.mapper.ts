import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { JourneyAggregate } from "../domain/journey.aggregate.js";
import { JourneyStatus } from "../domain/journey-status.enum.js";
import { Journey } from "./journey.entity.js";

@Injectable()
export class JourneyMapper implements Mapper<JourneyAggregate, RequiredEntityData<Journey>> {
    toDomain(record: Journey): JourneyAggregate {
        return JourneyAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                routeId: record.routeId,
                routeName: record.routeName,
                status: record.status as JourneyStatus,
                scheduledDate: record.scheduledDate,
                vehicleIds: record.vehicleIds ?? [],
                representativeIds: record.representativeIds ?? [],
                visitPointIds: record.visitPointIds ?? [],
            },
        });
    }

    toPersistence(domain: JourneyAggregate): RequiredEntityData<Journey> {
        return {
            id: domain.id as string,
            routeId: domain.routeId,
            routeName: domain.routeName,
            status: domain.status,
            scheduledDate: domain.scheduledDate,
            vehicleIds: domain.vehicleIds,
            representativeIds: domain.representativeIds,
            visitPointIds: domain.visitPointIds,
        };
    }

    toResponse(entity: JourneyAggregate) {
        return entity.toJSON();
    }
}
