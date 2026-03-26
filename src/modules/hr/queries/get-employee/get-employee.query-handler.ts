import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../../../shared/queries/get-employee.query.js";
import { EmployeeMapper } from "../../database/employee.mapper.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";

@QueryHandler(GetEmployeeQuery)
export class GetEmployeeQueryHandler implements IQueryHandler<GetEmployeeQuery, GetEmployeeResponse | null> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,
        private readonly mapper: EmployeeMapper,
    ) {}

    async execute(query: GetEmployeeQuery): Promise<GetEmployeeResponse | null> {
        const employee = await this.employeeRepo.findOneById(query.employeeId);
        if (!employee) {
            return null;
        }

        return this.mapper.toResponse(employee);
    }
}
