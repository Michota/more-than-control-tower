import { EntityManager } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Paginated, PaginatedQueryParameters } from "../../../libs/ports/repository.port.js";
import { EmployeeAggregate } from "../domain/employee.aggregate.js";
import { EmployeeRepositoryPort } from "./employee.repository.port.js";
import { Employee } from "./employee.entity.js";
import { EmployeeMapper } from "./employee.mapper.js";
import type { QualificationFilter } from "../../../shared/queries/find-employees-by-qualification.query.js";

const POPULATE = ["positionAssignments", "permissionOverrides"] as const;

@Injectable()
export class EmployeeRepository implements EmployeeRepositoryPort {
    private readonly mapper = new EmployeeMapper();

    constructor(private readonly em: EntityManager) {}

    async findOneById(id: string): Promise<EmployeeAggregate | null> {
        const record = await this.em.findOne(Employee, { id }, { populate: POPULATE });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByUserId(userId: string): Promise<EmployeeAggregate | null> {
        const record = await this.em.findOne(Employee, { userId }, { populate: POPULATE });
        return record ? this.mapper.toDomain(record) : null;
    }

    async existsByUserId(userId: string): Promise<boolean> {
        const count = await this.em.count(Employee, { userId });
        return count > 0;
    }

    async findByEmail(email: string): Promise<EmployeeAggregate | null> {
        const record = await this.em.findOne(Employee, { email }, { populate: POPULATE });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByPhone(phone: string): Promise<EmployeeAggregate | null> {
        const record = await this.em.findOne(Employee, { phone }, { populate: POPULATE });
        return record ? this.mapper.toDomain(record) : null;
    }

    async findByPositionAndQualifications(
        positionKey: string,
        filters: QualificationFilter[],
    ): Promise<EmployeeAggregate[]> {
        const records = await this.em.find(Employee, { positionAssignments: { positionKey } }, { populate: POPULATE });

        const domainEntities = records.map((r) => this.mapper.toDomain(r));

        if (filters.length === 0) {
            return domainEntities;
        }

        return domainEntities.filter((employee) => {
            const assignment = employee.positionAssignments.find((pa) => pa.positionKey === positionKey);
            if (!assignment) {
                return false;
            }

            return filters.every((filter) => {
                if (filter.operator === "eq") {
                    return assignment.hasQualification(filter.key, filter.value);
                }
                if (filter.operator === "contains") {
                    return assignment.hasQualification(filter.key, filter.value);
                }
                return false;
            });
        });
    }

    async findAll(): Promise<EmployeeAggregate[]> {
        const records = await this.em.find(Employee, {}, { populate: POPULATE });
        return records.map((r) => this.mapper.toDomain(r));
    }

    async findAllPaginated(params: PaginatedQueryParameters): Promise<Paginated<EmployeeAggregate>> {
        const [records, count] = await this.em.findAndCount(
            Employee,
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

    async save(entity: EmployeeAggregate | EmployeeAggregate[]): Promise<void> {
        const employees = Array.isArray(entity) ? entity : [entity];

        for (const employee of employees) {
            const data = this.mapper.toPersistence(employee);
            const existing = await this.em.findOne(Employee, { id: data.id }, { populate: POPULATE });

            if (existing) {
                this.em.assign(existing, data);
            } else {
                this.em.persist(this.em.create(Employee, data));
            }
        }
    }

    async delete(entity: EmployeeAggregate): Promise<boolean> {
        const record = await this.em.findOne(Employee, { id: entity.id as string });
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
