import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { JourneyAggregate } from "../domain/journey.aggregate.js";
import { JourneyRepositoryPort } from "./journey.repository.port.js";
import { Journey } from "./journey.entity.js";
import { JourneyMapper } from "./journey.mapper.js";

@Injectable()
export class JourneyRepository implements JourneyRepositoryPort {
    private readonly mapper = new JourneyMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<JourneyAggregate | null> {
        const record = await this.em.findOne(Journey, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByRouteAndDate(routeId: string, scheduledDate: string): Promise<JourneyAggregate | null> {
        const record = await this.em.findOne(Journey, { routeId, scheduledDate });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<JourneyAggregate[]> {
        const records = await this.em.find(Journey, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<JourneyAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Journey,
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

    async save(entity: JourneyAggregate | JourneyAggregate[]): Promise<void> {
        const journeys = Array.isArray(entity) ? entity : [entity];
        for (const journey of journeys) {
            await this.em.upsert(Journey, this.mapper.toPersistence(journey));
        }
    }

    async delete(entity: JourneyAggregate): Promise<boolean> {
        const record = await this.em.findOne(Journey, { id: entity.id as string });
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
