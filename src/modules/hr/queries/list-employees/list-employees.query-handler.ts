import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetEmployeeResponse } from "../../../../shared/queries/get-employee.query.js";
import { EmployeeMapper } from "../../database/employee.mapper.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { ListEmployeesQuery } from "./list-employees.query.js";

export interface ListEmployeesResponse {
    data: GetEmployeeResponse[];
    count: number;
    page: number;
    limit: number;
}

@QueryHandler(ListEmployeesQuery)
export class ListEmployeesQueryHandler implements IQueryHandler<ListEmployeesQuery, ListEmployeesResponse> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,
        private readonly mapper: EmployeeMapper,
    ) {}

    async execute(query: ListEmployeesQuery): Promise<ListEmployeesResponse> {
        const result = await this.employeeRepo.findAllPaginated({
            limit: query.limit,
            offset: (query.page - 1) * query.limit,
            page: query.page,
            orderBy: { field: "id" as const, direction: "asc" },
        });

        return {
            data: result.data.map((e) => this.mapper.toResponse(e)),
            count: result.count,
            page: query.page,
            limit: query.limit,
        };
    }
}
