import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { WarehouseAggregate } from "../domain/warehouse.aggregate.js";
import { WarehouseRepositoryPort } from "./warehouse.repository.port.js";
import { Warehouse } from "./warehouse.entity.js";
import { WarehouseMapper } from "./warehouse.mapper.js";

@Injectable()
export class WarehouseRepository implements WarehouseRepositoryPort {
    private readonly mapper = new WarehouseMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<WarehouseAggregate | null> {
        const record = await this.em.findOne(Warehouse, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<WarehouseAggregate[]> {
        const records = await this.em.find(Warehouse, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<WarehouseAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Warehouse,
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

    // eslint-disable-next-line @typescript-eslint/require-await
    async save(entity: WarehouseAggregate | WarehouseAggregate[]): Promise<void> {
        const warehouses = Array.isArray(entity) ? entity : [entity];
        for (const warehouse of warehouses) {
            this.em.persist(this.em.create(Warehouse, this.mapper.toPersistence(warehouse)));
        }
    }

    async delete(entity: WarehouseAggregate): Promise<boolean> {
        const record = await this.em.findOne(Warehouse, { id: entity.id as string });
        if (!record) return false;
        this.em.remove(record);
        return true;
    }

    async transaction<T>(handler: () => Promise<T>): Promise<T> {
        return this.em.transactional(handler);
    }
}
