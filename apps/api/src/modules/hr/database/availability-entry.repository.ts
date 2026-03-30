import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { AvailabilityEntryAggregate } from "../domain/availability-entry.aggregate.js";
import { AvailabilityEntryRepositoryPort } from "./availability-entry.repository.port.js";
import { AvailabilityEntry } from "./availability-entry.entity.js";
import { AvailabilityEntryMapper } from "./availability-entry.mapper.js";

@Injectable()
export class AvailabilityEntryRepository implements AvailabilityEntryRepositoryPort {
    private readonly mapper = new AvailabilityEntryMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<AvailabilityEntryAggregate | null> {
        const record = await this.em.findOne(AvailabilityEntry, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByEmployeeId(employeeId: string): Promise<AvailabilityEntryAggregate[]> {
        const records = await this.em.find(
            AvailabilityEntry,
            { employeeId },
            { orderBy: { date: "asc", startTime: "asc" } },
        );
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findByEmployeeIdAndDates(employeeId: string, dates: string[]): Promise<AvailabilityEntryAggregate[]> {
        const records = await this.em.find(AvailabilityEntry, { employeeId, date: { $in: dates } });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findByEmployeeIdAndDateRange(
        employeeId: string,
        fromDate: string,
        toDate: string,
    ): Promise<AvailabilityEntryAggregate[]> {
        const records = await this.em.find(
            AvailabilityEntry,
            { employeeId, date: { $gte: fromDate, $lte: toDate } },
            { orderBy: { date: "asc", startTime: "asc" } },
        );
        return records.map((r) => this.mapper.toDomain(r));
    }

    async deleteByEmployeeIdAndDates(employeeId: string, dates: string[]): Promise<void> {
        await this.em.nativeDelete(AvailabilityEntry, { employeeId, date: { $in: dates } });
    }

    async save(entity: AvailabilityEntryAggregate | AvailabilityEntryAggregate[]): Promise<void> {
        const entries = Array.isArray(entity) ? entity : [entity];

        for (const entry of entries) {
            const data = this.mapper.toPersistence(entry);
            const existing = await this.em.findOne(AvailabilityEntry, { id: data.id });

            if (existing) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _, ...updateData } = data as Record<string, unknown>;
                this.em.assign(existing, updateData);
            } else {
                this.em.persist(this.em.create(AvailabilityEntry, data));
            }
        }
    }

    async delete(entity: AvailabilityEntryAggregate): Promise<boolean> {
        const record = await this.em.findOne(AvailabilityEntry, { id: entity.id as string });
        if (!record) {
            return false;
        }
        this.em.remove(record);
        return true;
    }
}
