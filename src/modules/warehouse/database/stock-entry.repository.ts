import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { StockEntryAggregate } from "../domain/stock-entry.aggregate.js";
import { StockEntryRepositoryPort } from "./stock-entry.repository.port.js";
import { StockEntry } from "./stock-entry.entity.js";
import { StockEntryMapper } from "./stock-entry.mapper.js";

@Injectable()
export class StockEntryRepository implements StockEntryRepositoryPort {
    private readonly mapper = new StockEntryMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<StockEntryAggregate | null> {
        const record = await this.em.findOne(StockEntry, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByGoodAndWarehouse(goodId: string, warehouseId: string): Promise<StockEntryAggregate | null> {
        const record = await this.em.findOne(StockEntry, { goodId, warehouseId });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByWarehouse(warehouseId: string): Promise<StockEntryAggregate[]> {
        const records = await this.em.find(StockEntry, { warehouseId });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAll(): Promise<StockEntryAggregate[]> {
        const records = await this.em.find(StockEntry, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<StockEntryAggregate>> {
        const [records, count] = await this.em.findAndCount(
            StockEntry,
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

    async save(entity: StockEntryAggregate | StockEntryAggregate[]): Promise<void> {
        const entries = Array.isArray(entity) ? entity : [entity];
        for (const entry of entries) {
            await this.em.upsert(StockEntry, this.mapper.toPersistence(entry));
        }
    }

    async delete(entity: StockEntryAggregate): Promise<boolean> {
        const record = await this.em.findOne(StockEntry, { id: entity.id as string });
        if (!record) return false;
        this.em.remove(record);
        return true;
    }

    async transaction<T>(handler: () => Promise<T>): Promise<T> {
        return this.em.transactional(handler);
    }
}
