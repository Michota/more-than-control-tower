import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { ActivityLogEntryEntity } from "../domain/activity-log-entry.entity.js";
import { ActivityLogEntry } from "./activity-log-entry.entity.js";
import { ActivityLogEntryMapper } from "./activity-log-entry.mapper.js";
import { type ActivityLogEntryRepositoryPort } from "./activity-log-entry.repository.port.js";

@Injectable()
export class ActivityLogEntryRepository implements ActivityLogEntryRepositoryPort {
    private readonly mapper = new ActivityLogEntryMapper();

    constructor(private readonly em: EntityManager) {}

    async save(entity: ActivityLogEntryEntity): Promise<void> {
        await this.em.upsert(ActivityLogEntry, this.mapper.toPersistence(entity) as ActivityLogEntry);
    }

    async findByEmployeeAndDateRange(employeeId: string, from: Date, to: Date): Promise<ActivityLogEntryEntity[]> {
        const records = await this.em.find(
            ActivityLogEntry,
            {
                employeeId,
                occurredAt: { $gte: from, $lte: to },
            },
            { orderBy: { occurredAt: "DESC" } },
        );
        return records.map((r) => this.mapper.toDomain(r));
    }

    async deleteOlderThan(date: Date): Promise<number> {
        return this.em.nativeDelete(ActivityLogEntry, { occurredAt: { $lt: date } });
    }
}
