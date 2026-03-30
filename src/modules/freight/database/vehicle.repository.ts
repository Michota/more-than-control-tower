import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { VehicleAggregate } from "../domain/vehicle.aggregate.js";
import { VehicleRepositoryPort } from "./vehicle.repository.port.js";
import { Vehicle } from "./vehicle.entity.js";
import { VehicleMapper } from "./vehicle.mapper.js";

@Injectable()
export class VehicleRepository implements VehicleRepositoryPort {
    private readonly mapper = new VehicleMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<VehicleAggregate | null> {
        const record = await this.em.findOne(Vehicle, { id });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByVin(vin: string): Promise<VehicleAggregate | null> {
        const record = await this.em.findOne(Vehicle, { vin });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByLicensePlate(licensePlate: string): Promise<VehicleAggregate | null> {
        const record = await this.em.findOne(Vehicle, { licensePlate });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<VehicleAggregate[]> {
        const records = await this.em.find(Vehicle, {});
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<VehicleAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Vehicle,
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

    async save(entity: VehicleAggregate | VehicleAggregate[]): Promise<void> {
        const vehicles = Array.isArray(entity) ? entity : [entity];
        for (const vehicle of vehicles) {
            await this.em.upsert(Vehicle, this.mapper.toPersistence(vehicle));
        }
    }

    async delete(entity: VehicleAggregate): Promise<boolean> {
        const record = await this.em.findOne(Vehicle, { id: entity.id as string });
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
