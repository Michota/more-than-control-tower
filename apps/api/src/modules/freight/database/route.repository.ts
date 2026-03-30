import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { RouteAggregate } from "../domain/route.aggregate.js";
import { RouteRepositoryPort } from "./route.repository.port.js";
import { Route } from "./route.entity.js";
import { RouteMapper } from "./route.mapper.js";

@Injectable()
export class RouteRepository implements RouteRepositoryPort {
    private readonly mapper = new RouteMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<RouteAggregate | null> {
        const record = await this.em.findOne(Route, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<RouteAggregate[]> {
        const records = await this.em.find(Route, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<RouteAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Route,
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

    async save(entity: RouteAggregate | RouteAggregate[]): Promise<void> {
        const routes = Array.isArray(entity) ? entity : [entity];
        for (const route of routes) {
            await this.em.upsert(Route, this.mapper.toPersistence(route) as any);
        }
    }

    async delete(entity: RouteAggregate): Promise<boolean> {
        const record = await this.em.findOne(Route, { id: entity.id as string });
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
