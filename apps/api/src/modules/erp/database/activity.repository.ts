import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { ActivityAggregate } from "../domain/activity.aggregate.js";
import { Activity } from "./activity.entity.js";
import { ActivityMapper } from "./activity.mapper.js";
import { type ActivityRepositoryPort } from "./activity.repository.port.js";

@Injectable()
export class ActivityRepository implements ActivityRepositoryPort {
    private readonly mapper = new ActivityMapper();

    constructor(private readonly em: EntityManager) {}

    async save(entity: ActivityAggregate | ActivityAggregate[]): Promise<void> {
        const activities = Array.isArray(entity) ? entity : [entity];
        for (const activity of activities) {
            await this.em.upsert(Activity, this.mapper.toPersistence(activity) as Activity);
        }
    }

    async findOneById(id: string): Promise<ActivityAggregate | null> {
        const record = await this.em.findOne(Activity, { id });
        if (!record) {
            return null;
        }
        return this.mapper.toDomain(record);
    }

    async findAll(): Promise<ActivityAggregate[]> {
        const records = await this.em.find(Activity, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<ActivityAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Activity,
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

    async delete(entity: ActivityAggregate): Promise<boolean> {
        const record = await this.em.findOne(Activity, { id: entity.id as string });
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
