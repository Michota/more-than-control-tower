import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { OrderAggregate } from "../domain/order.aggregate.js";
import { OrderStatus } from "../domain/order-status.enum.js";
import { Order } from "./order.entity.js";
import { OrderMapper } from "./order.mapper.js";
import { OrderRepositoryPort } from "./order.repository.port.js";

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
    private readonly mapper = new OrderMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<OrderAggregate | null> {
        const record = await this.em.findOne(Order, { id }, { populate: ["orderLines.product.prices"] as const });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<OrderAggregate[]> {
        const records = await this.em.find(Order, {}, { populate: ["orderLines.product.prices"] as const });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<OrderAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Order,
            {},
            {
                populate: ["orderLines.product.prices"] as const,
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

    /**
     * Persists the order to the MikroORM unit of work without flushing.
     * em.flush() is called by MikroOrmUnitOfWork.commit() at the end of the use case.
     */
    async save(entity: OrderAggregate | OrderAggregate[]): Promise<void> {
        const orders = Array.isArray(entity) ? entity : [entity];
        for (const order of orders) {
            this.em.persist(this.em.create(Order, this.mapper.toPersistence(order)));
        }

        return Promise.resolve();
    }

    async delete(order: OrderAggregate): Promise<boolean> {
        const record = await this.em.findOne(Order, { id: order.id as string });
        if (!record) return false;
        this.em.remove(record);
        return true;
    }

    async transaction<T>(handler: () => Promise<T>): Promise<T> {
        return this.em.transactional(handler);
    }

    async isStockEntryAssigned(stockEntryId: string): Promise<boolean> {
        const connection = this.em.getConnection();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result: { exists: boolean }[] = await connection.execute(
            `SELECT EXISTS(
                SELECT 1 FROM "order"
                WHERE status NOT IN (?, ?)
                AND "order_lines"::jsonb @> ?::jsonb
            ) AS "exists"`,
            [OrderStatus.CANCELLED, OrderStatus.COMPLETED, JSON.stringify([{ stockEntryId }])],
        );

        return result[0]?.exists === true;
    }
}
