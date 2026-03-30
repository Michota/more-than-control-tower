import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { GoodsReceiptAggregate } from "../domain/goods-receipt.aggregate.js";
import { GoodsReceiptRepositoryPort } from "./goods-receipt.repository.port.js";
import { GoodsReceipt } from "./goods-receipt.entity.js";
import { GoodsReceiptMapper } from "./goods-receipt.mapper.js";

@Injectable()
export class GoodsReceiptRepository implements GoodsReceiptRepositoryPort {
    private readonly mapper = new GoodsReceiptMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<GoodsReceiptAggregate | null> {
        const record = await this.em.findOne(GoodsReceipt, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<GoodsReceiptAggregate[]> {
        const records = await this.em.find(GoodsReceipt, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<GoodsReceiptAggregate>> {
        const [records, count] = await this.em.findAndCount(
            GoodsReceipt,
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

    async save(entity: GoodsReceiptAggregate | GoodsReceiptAggregate[]): Promise<void> {
        const receipts = Array.isArray(entity) ? entity : [entity];
        for (const receipt of receipts) {
            await this.em.upsert(GoodsReceipt, this.mapper.toPersistence(receipt));
        }
    }

    async delete(entity: GoodsReceiptAggregate): Promise<boolean> {
        const record = await this.em.findOne(GoodsReceipt, { id: entity.id as string });
        if (!record) return false;
        this.em.remove(record);
        return true;
    }

    async transaction<T>(handler: () => Promise<T>): Promise<T> {
        return this.em.transactional(handler);
    }
}
