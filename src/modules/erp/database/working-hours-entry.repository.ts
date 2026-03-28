import { Injectable } from "@nestjs/common";
import { EntityManager, type FilterQuery } from "@mikro-orm/core";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { WorkingHoursEntryAggregate } from "../domain/working-hours-entry.aggregate.js";
import { WorkingHoursStatus } from "../domain/working-hours-status.enum.js";
import { WorkingHoursEntry } from "./working-hours-entry.entity.js";
import { WorkingHoursEntryMapper } from "./working-hours-entry.mapper.js";
import {
    type FindByEmployeeAndDateRangeParams,
    type WorkingHoursEntryRepositoryPort,
} from "./working-hours-entry.repository.port.js";

@Injectable()
export class WorkingHoursEntryRepository implements WorkingHoursEntryRepositoryPort {
    private readonly mapper = new WorkingHoursEntryMapper();

    constructor(private readonly em: EntityManager) {}

    async save(entity: WorkingHoursEntryAggregate | WorkingHoursEntryAggregate[]): Promise<void> {
        const entries = Array.isArray(entity) ? entity : [entity];
        for (const entry of entries) {
            await this.em.upsert(WorkingHoursEntry, this.mapper.toPersistence(entry) as WorkingHoursEntry);
        }
    }

    async findOneById(id: string): Promise<WorkingHoursEntryAggregate | null> {
        const record = await this.em.findOne(WorkingHoursEntry, { id });
        if (!record) {
            return null;
        }
        return this.mapper.toDomain(record);
    }

    async findAll(): Promise<WorkingHoursEntryAggregate[]> {
        const records = await this.em.find(WorkingHoursEntry, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<WorkingHoursEntryAggregate>> {
        const [records, count] = await this.em.findAndCount(
            WorkingHoursEntry,
            {},
            {
                limit: params.limit,
                offset: params.offset,
                orderBy: { [params.orderBy.field === true ? "id" : params.orderBy.field]: params.orderBy.direction },
            },
        );

        return new Paginated({
            data: records.map((r) => this.mapper.toDomain(r)),
            count,
            limit: params.limit,
            page: params.page,
        });
    }

    async delete(entity: WorkingHoursEntryAggregate): Promise<boolean> {
        const record = await this.em.findOne(WorkingHoursEntry, { id: entity.id as string });
        if (!record) {
            return false;
        }
        this.em.remove(record);
        return true;
    }

    async transaction<T>(handler: () => Promise<T>): Promise<T> {
        return this.em.transactional(handler);
    }

    async findByEmployeeAndDateRange(params: FindByEmployeeAndDateRangeParams): Promise<WorkingHoursEntryAggregate[]> {
        const where: FilterQuery<WorkingHoursEntry> = {
            employeeId: params.employeeId,
            date: { $gte: params.dateFrom, $lte: params.dateTo },
        };

        const records = await this.em.find(WorkingHoursEntry, where, { orderBy: { date: "ASC" } });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findOpenByEmployeeAndDateRange(
        params: FindByEmployeeAndDateRangeParams,
    ): Promise<WorkingHoursEntryAggregate[]> {
        const where: FilterQuery<WorkingHoursEntry> = {
            employeeId: params.employeeId,
            date: { $gte: params.dateFrom, $lte: params.dateTo },
            status: WorkingHoursStatus.OPEN,
        };

        const records = await this.em.find(WorkingHoursEntry, where, { orderBy: { date: "ASC" } });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async existsByActivityId(activityId: string): Promise<boolean> {
        const count = await this.em.count(WorkingHoursEntry, { activityId });
        return count > 0;
    }
}
