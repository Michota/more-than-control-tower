import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { type FilterQuery } from "@mikro-orm/core";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { OrderAggregate } from "../domain/order.aggregate.js";
import { OrderStatus } from "../domain/order-status.enum.js";
import { Order } from "./order.entity.js";
import { Product } from "./product.entity.js";
import { OrderMapper } from "./order.mapper.js";
import { type FindFilteredParams, OrderRepositoryPort } from "./order.repository.port.js";

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
    private readonly mapper = new OrderMapper();

    constructor(private readonly em: EntityManager) {}

    /**
     * Populates order line products separately to avoid MikroORM's JSONB
     * embedded relation join which causes a text-to-uuid type mismatch in PostgreSQL.
     */
    private async populateOrderLineProducts(orders: Order[]): Promise<void> {
        const productIds = orders.flatMap((o) => o.orderLines.map((l) => l.product.id));
        if (productIds.length === 0) return;

        const products = await this.em.find(Product, { id: { $in: productIds } }, { populate: ["prices"] });
        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const order of orders) {
            for (const line of order.orderLines) {
                const product = productMap.get(line.product.id);
                if (product) {
                    line.product = product;
                }
            }
        }
    }

    async findOneById(id: string): Promise<OrderAggregate | null> {
        const record = await this.em.findOne(Order, { id });
        if (!record) return null;

        await this.populateOrderLineProducts([record]);
        return this.mapper.toDomain(record);
    }

    async findAll(): Promise<OrderAggregate[]> {
        const records = await this.em.find(Order, {});
        await this.populateOrderLineProducts(records);
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<OrderAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Order,
            {},
            {
                limit: params.limit,
                offset: params.offset,
                orderBy: { [params.orderBy.field === true ? "id" : params.orderBy.field]: params.orderBy.direction },
            },
        );

        await this.populateOrderLineProducts(records);

        return new Paginated({
            data: records.map((r) => this.mapper.toDomain(r)),
            count,
            limit: params.limit,
            page: params.page,
        });
    }

    /**
     * Persists the order to the MikroORM unit of work without flushing.
     * Uses upsert to handle both new orders and updates to existing orders.
     * em.flush() is called by MikroOrmUnitOfWork.commit() at the end of the use case.
     */
    async save(entity: OrderAggregate | OrderAggregate[]): Promise<void> {
        const orders = Array.isArray(entity) ? entity : [entity];
        for (const order of orders) {
            await this.em.upsert(Order, this.mapper.toPersistence(order) as Order);
        }
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

    async findByCustomerId(customerId: string): Promise<OrderAggregate[]> {
        const records = await this.em.find(Order, { customerId });
        await this.populateOrderLineProducts(records);
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findFilteredPaginated(params: FindFilteredParams): Promise<Paginated<OrderAggregate>> {
        const where: FilterQuery<Order> = {};

        if (params.customerId) {
            where.customerId = params.customerId;
        }

        if (params.status) {
            where.status = params.status as OrderStatus;
        }

        const offset = (params.page - 1) * params.limit;

        const [records, count] = await this.em.findAndCount(Order, where, {
            limit: params.limit,
            offset,
            orderBy: { id: "ASC" },
        });

        await this.populateOrderLineProducts(records);

        return new Paginated({
            data: records.map((r) => this.mapper.toDomain(r)),
            count,
            limit: params.limit,
            page: params.page,
        });
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
            [OrderStatus.CANCELLED, OrderStatus.COMPLETED, JSON.stringify([{ stock_entry_id: stockEntryId }])],
        );

        return result[0]?.exists === true;
    }
}
