import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { CustomerAggregate } from "../domain/customer.aggregate.js";
import { ContactHistoryEntry } from "../domain/contact-history-entry.value-object.js";
import { CustomerRepositoryPort, PersistedContactSnapshot } from "./customer.repository.port.js";
import { Customer } from "./customer.entity.js";
import { CustomerContact } from "./customer-contact.entity.js";
import { CustomerMapper } from "./customer.mapper.js";
import { PaginationParameters } from "src/libs/types/pagination.js";

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
        pagination: PaginationParameters = { page: 1, limit: 20 },
    ): Promise<{ data: CustomerAggregate[]; count: number }> {
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

        const [records, count] = await this.em.findAndCount(
            Customer,
            { $or: conditions },
            {
                populate: POPULATE,
                limit: pagination.limit,
                offset: (pagination.page - 1) * pagination.limit,
            },
        );

        return { data: records.map((r) => this.mapper.toDomain(r)), count };
    }

    async save(entity: CustomerAggregate | CustomerAggregate[]): Promise<void> {
        const customers = Array.isArray(entity) ? entity : [entity];

        for (const customer of customers) {
            const data = this.mapper.toPersistence(customer);
            const existing = await this.em.findOne(Customer, { id: data.id }, { populate: POPULATE });

            if (existing) {
                this.em.assign(existing, data);
            } else {
                this.em.persist(this.em.create(Customer, data));
            }
        }
    }

    async findContactSnapshots(customerId: string): Promise<PersistedContactSnapshot[]> {
        const contacts = await this.em.find(CustomerContact, { customer: { id: customerId } });

        return contacts.map((c) => ({
            id: c.id,
            value: c.value,
            history: (c.history ?? []).map(
                (h) =>
                    new ContactHistoryEntry({
                        previousValue: h.previousValue,
                        changedAt: h.changedAt,
                    }),
            ),
        }));
    }

    async delete(entity: CustomerAggregate): Promise<boolean> {
        const record = await this.em.findOne(Customer, { id: entity.id as string });
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
