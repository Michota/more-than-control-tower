import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { GoodAggregate } from "../domain/good.aggregate.js";
import { FindGoodsParams, GoodRepositoryPort } from "./good.repository.port.js";
import { Good } from "./good.entity.js";
import { GoodMapper } from "./good.mapper.js";

@Injectable()
export class GoodRepository implements GoodRepositoryPort {
    private readonly mapper = new GoodMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<GoodAggregate | null> {
        const record = await this.em.findOne(Good, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<GoodAggregate[]> {
        const records = await this.em.find(Good, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<GoodAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Good,
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

    async findPaginated(params: FindGoodsParams): Promise<Paginated<GoodAggregate>> {
        const where = params.name ? { name: { $ilike: `%${params.name}%` } } : {};
        const [records, count] = await this.em.findAndCount(Good, where, {
            limit: params.limit,
            offset: (params.page - 1) * params.limit,
            orderBy: { name: "asc" },
        });
        return new Paginated({
            data: records.map((r) => this.mapper.toDomain(r)),
            count,
            limit: params.limit,
            page: params.page,
        });
    }

    async findByParentId(parentId: string): Promise<GoodAggregate[]> {
        const records = await this.em.find(Good, { parentId });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async save(entity: GoodAggregate | GoodAggregate[]): Promise<void> {
        const goods = Array.isArray(entity) ? entity : [entity];
        for (const good of goods) {
            await this.em.upsert(Good, this.mapper.toPersistence(good));
        }
    }

    async delete(entity: GoodAggregate): Promise<boolean> {
        const record = await this.em.findOne(Good, { id: entity.id as string });
        if (!record) return false;
        this.em.remove(record);
        return true;
    }

    async transaction<T>(handler: () => Promise<T>): Promise<T> {
        return this.em.transactional(handler);
    }
}
