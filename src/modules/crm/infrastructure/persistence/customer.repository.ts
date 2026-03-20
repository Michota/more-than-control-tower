import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../../libs/ports/repository.port.js";
import { CustomerAggregate } from "../../domain/customer.aggregate.js";
import { CustomerRepositoryPort } from "../customer.repository.port.js";
import { Customer } from "./customer.entity.js";
import { CustomerMapper } from "./customer.mapper.js";

const POPULATE = ["addresses", "contacts"] as const;

@Injectable()
export class CustomerRepository implements CustomerRepositoryPort {
    private readonly mapper = new CustomerMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<CustomerAggregate | null> {
        const record = await this.em.findOne(Customer, { id }, { populate: POPULATE });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findAll(): Promise<CustomerAggregate[]> {
        const records = await this.em.find(Customer, {}, { populate: POPULATE });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<CustomerAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Customer,
            {},
            {
                populate: POPULATE,
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
        filters: {
            alsoSearchByDescription?: boolean;
            alsoSearchByAddress?: boolean;
            alsoSearchByEmail?: boolean;
            alsoSearchByPhone?: boolean;
        } = {},
    ): Promise<CustomerAggregate[]> {
        const pattern = `%${term}%`;
        const conditions: object[] = [{ name: { $ilike: pattern } }];

        if (filters.alsoSearchByDescription) {
            conditions.push({ description: { $ilike: pattern } });
        }

        if (filters.alsoSearchByAddress) {
            conditions.push(
                { addresses: { city: { $ilike: pattern } } },
                { addresses: { country: { $ilike: pattern } } },
                { addresses: { street: { $ilike: pattern } } },
            );
        }

        if (filters.alsoSearchByEmail) {
            conditions.push({ contacts: { type: "email", value: { $ilike: pattern } } });
        }

        if (filters.alsoSearchByPhone) {
            conditions.push({ contacts: { type: "phone", value: { $ilike: pattern } } });
        }

        const records = await this.em.find(Customer, { $or: conditions }, { populate: POPULATE });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async save(entity: CustomerAggregate | CustomerAggregate[]): Promise<void> {
        const customers = Array.isArray(entity) ? entity : [entity];
        for (const customer of customers) {
            this.em.persist(this.em.create(Customer, this.mapper.toPersistence(customer)));
        }
        return Promise.resolve();
    }

    async delete(entity: CustomerAggregate): Promise<boolean> {
        const record = await this.em.findOne(Customer, { id: entity.id as string });
        if (!record) return false;
        this.em.remove(record);
        return true;
    }

    async transaction<T>(handler: () => Promise<T>): Promise<T> {
        return this.em.transactional(handler);
    }
}
