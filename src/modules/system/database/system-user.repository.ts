import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { PaginationParameters } from "src/libs/types/pagination.js";
import { SystemUserStatus } from "../domain/system-user-status.enum.js";
import { SystemUserAggregate } from "../domain/system-user.aggregate.js";
import { SystemUserRepositoryPort } from "./system-user.repository.port.js";
import { SystemUser } from "./system-user.entity.js";
import { SystemUserMapper } from "./system-user.mapper.js";

@Injectable()
export class SystemUserRepository implements SystemUserRepositoryPort {
    private readonly mapper = new SystemUserMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<SystemUserAggregate | null> {
        const record = await this.em.findOne(SystemUser, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByEmail(email: string): Promise<SystemUserAggregate | null> {
        const record = await this.em.findOne(SystemUser, { email });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<SystemUserAggregate[]> {
        const records = await this.em.find(SystemUser, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<SystemUserAggregate>> {
        const [records, count] = await this.em.findAndCount(
            SystemUser,
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

    async search(
        term: string,
        pagination: PaginationParameters = { page: 1, limit: 20 },
    ): Promise<{ data: SystemUserAggregate[]; count: number }> {
        const pattern = `%${term}%`;

        const [records, count] = await this.em.findAndCount(
            SystemUser,
            {
                $or: [{ email: { $ilike: pattern } }, { name: { $ilike: pattern } }],
            },
            {
                limit: pagination.limit,
                offset: (pagination.page - 1) * pagination.limit,
            },
        );

        return { data: records.map((r) => this.mapper.toDomain(r)), count };
    }

    async save(entity: SystemUserAggregate | SystemUserAggregate[]): Promise<void> {
        const users = Array.isArray(entity) ? entity : [entity];

        for (const user of users) {
            const data = this.mapper.toPersistence(user);
            const existing = await this.em.findOne(SystemUser, { id: data.id });

            if (existing) {
                this.em.assign(existing, data);
            } else {
                this.em.persist(this.em.create(SystemUser, data));
            }
        }
    }

    async countActiveAdmins(): Promise<number> {
        return this.em.count(SystemUser, {
            roles: { $contains: ["administrator"] },
            status: { $ne: SystemUserStatus.SUSPENDED },
        });
    }

    async delete(entity: SystemUserAggregate): Promise<boolean> {
        const record = await this.em.findOne(SystemUser, { id: entity.id as string });
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
