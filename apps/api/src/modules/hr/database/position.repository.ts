import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { PositionAggregate } from "../domain/position.aggregate.js";
import { PositionRepositoryPort } from "./position.repository.port.js";
import { Position } from "./position.entity.js";
import { PositionMapper } from "./position.mapper.js";

@Injectable()
export class PositionRepository implements PositionRepositoryPort {
    private readonly mapper = new PositionMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<PositionAggregate | null> {
        const record = await this.em.findOne(Position, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByKey(key: string): Promise<PositionAggregate | null> {
        const record = await this.em.findOne(Position, { key });
        return record ? this.mapper.toDomain(record) : null;
    }

    async existsByKey(key: string): Promise<boolean> {
        const count = await this.em.count(Position, { key });
        return count > 0;
    }

    async findAll(): Promise<PositionAggregate[]> {
        const records = await this.em.find(Position, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<PositionAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Position,
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

    async save(entity: PositionAggregate | PositionAggregate[]): Promise<void> {
        const positions = Array.isArray(entity) ? entity : [entity];

        for (const position of positions) {
            const data = this.mapper.toPersistence(position);
            const existing = await this.em.findOne(Position, { id: data.id });

            if (existing) {
                this.em.assign(existing, data);
            } else {
                this.em.persist(this.em.create(Position, data));
            }
        }
    }

    async delete(entity: PositionAggregate): Promise<boolean> {
        const record = await this.em.findOne(Position, { id: entity.id as string });
        if (!record) {
            return false;
        }
        this.em.remove(record);
        return true;
    }

    async transaction<T>(handler: () => Promise<T>): Promise<T> {
        return this.em.transactional(handler);
    }
}
