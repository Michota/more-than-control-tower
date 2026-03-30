import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { CodeAggregate } from "../domain/code.aggregate.js";
import { CodeRepositoryPort } from "./code.repository.port.js";
import { Code } from "./code.entity.js";
import { CodeMapper } from "./code.mapper.js";

@Injectable()
export class CodeRepository implements CodeRepositoryPort {
    private readonly mapper = new CodeMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<CodeAggregate | null> {
        const record = await this.em.findOne(Code, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByValue(value: string): Promise<CodeAggregate | null> {
        const record = await this.em.findOne(Code, { value });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByGoodId(goodId: string): Promise<CodeAggregate[]> {
        const records = await this.em.find(Code, { goodId });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAll(): Promise<CodeAggregate[]> {
        const records = await this.em.find(Code, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<CodeAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Code,
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

    async save(entity: CodeAggregate | CodeAggregate[]): Promise<void> {
        const codes = Array.isArray(entity) ? entity : [entity];
        for (const code of codes) {
            await this.em.upsert(Code, this.mapper.toPersistence(code));
        }
    }

    async delete(entity: CodeAggregate): Promise<boolean> {
        const record = await this.em.findOne(Code, { id: entity.id as string });
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
