import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { AvailabilityEntryAggregate } from "../domain/availability-entry.aggregate.js";
import { AvailabilityEntryStatus } from "../domain/availability-entry-status.enum.js";
import { AvailabilityEntry } from "./availability-entry.entity.js";

export interface AvailabilityEntryResponse {
    id: string;
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    locked: boolean;
}

@Injectable()
export class AvailabilityEntryMapper {
    toDomain(record: AvailabilityEntry): AvailabilityEntryAggregate {
        return AvailabilityEntryAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                employeeId: record.employeeId,
                date: record.date,
                startTime: record.startTime,
                endTime: record.endTime,
                status: record.status as AvailabilityEntryStatus,
                locked: record.locked,
            },
        });
    }

    toPersistence(domain: AvailabilityEntryAggregate): RequiredEntityData<AvailabilityEntry> {
        return {
            id: domain.id as string,
            employeeId: domain.employeeId,
            date: domain.date,
            startTime: domain.startTime,
            endTime: domain.endTime,
            status: domain.status,
            locked: domain.locked,
        };
    }

    toResponse(domain: AvailabilityEntryAggregate): AvailabilityEntryResponse {
        return {
            id: domain.id,
            employeeId: domain.employeeId,
            date: domain.date,
            startTime: domain.startTime,
            endTime: domain.endTime,
            status: domain.status,
            locked: domain.locked,
        };
    }
}
