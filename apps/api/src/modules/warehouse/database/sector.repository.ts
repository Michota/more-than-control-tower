import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { SectorAggregate } from "../domain/sector.aggregate.js";
import { SectorRepositoryPort } from "./sector.repository.port.js";
import { Sector } from "./sector.entity.js";
import { SectorMapper } from "./sector.mapper.js";

@Injectable()
export class SectorRepository implements SectorRepositoryPort {
    private readonly mapper = new SectorMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<SectorAggregate | null> {
        const record = await this.em.findOne(Sector, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByWarehouseId(warehouseId: string): Promise<SectorAggregate[]> {
        const records = await this.em.find(Sector, { warehouseId });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAll(): Promise<SectorAggregate[]> {
        const records = await this.em.find(Sector, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<SectorAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Sector,
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

    async save(entity: SectorAggregate | SectorAggregate[]): Promise<void> {
        const sectors = Array.isArray(entity) ? entity : [entity];
        for (const sector of sectors) {
            await this.em.upsert(Sector, this.mapper.toPersistence(sector));
        }
    }

    async delete(entity: SectorAggregate): Promise<boolean> {
        const record = await this.em.findOne(Sector, { id: entity.id as string });
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
