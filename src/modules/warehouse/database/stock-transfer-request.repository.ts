import { EntityManager, FilterQuery } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { StockTransferRequestAggregate } from "../domain/stock-transfer-request.aggregate.js";
import {
    FindTransferRequestsParams,
    StockTransferRequestRepositoryPort,
} from "./stock-transfer-request.repository.port.js";
import { StockTransferRequest } from "./stock-transfer-request.entity.js";
import { StockTransferRequestMapper } from "./stock-transfer-request.mapper.js";

@Injectable()
export class StockTransferRequestRepository implements StockTransferRequestRepositoryPort {
    private readonly mapper = new StockTransferRequestMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<StockTransferRequestAggregate | null> {
        const record = await this.em.findOne(StockTransferRequest, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<StockTransferRequestAggregate[]> {
        const records = await this.em.find(StockTransferRequest, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<StockTransferRequestAggregate>> {
        const [records, count] = await this.em.findAndCount(
            StockTransferRequest,
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

    async findFiltered(params: FindTransferRequestsParams): Promise<Paginated<StockTransferRequestAggregate>> {
        const where: FilterQuery<StockTransferRequest> = {};
        if (params.status) {
            where.status = params.status;
        }
        if (params.fromWarehouseId) {
            where.fromWarehouseId = params.fromWarehouseId;
        }
        if (params.toWarehouseId) {
            where.toWarehouseId = params.toWarehouseId;
        }

        const [records, count] = await this.em.findAndCount(StockTransferRequest, where, {
            limit: params.limit,
            offset: (params.page - 1) * params.limit,
            orderBy: { id: "desc" },
        });

        return new Paginated({
            data: records.map((r) => this.mapper.toDomain(r)),
            count,
            limit: params.limit,
            page: params.page,
        });
    }

    async save(entity: StockTransferRequestAggregate | StockTransferRequestAggregate[]): Promise<void> {
        const requests = Array.isArray(entity) ? entity : [entity];
        for (const request of requests) {
            await this.em.upsert(StockTransferRequest, this.mapper.toPersistence(request));
        }
    }

    async delete(entity: StockTransferRequestAggregate): Promise<boolean> {
        const record = await this.em.findOne(StockTransferRequest, { id: entity.id as string });
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
