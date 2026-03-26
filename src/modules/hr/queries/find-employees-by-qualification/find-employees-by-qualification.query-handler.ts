import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    FindEmployeesByQualificationQuery,
    FindEmployeesByQualificationResponse,
} from "../../../../shared/queries/find-employees-by-qualification.query.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";

@QueryHandler(FindEmployeesByQualificationQuery)
export class FindEmployeesByQualificationQueryHandler implements IQueryHandler<
    FindEmployeesByQualificationQuery,
    FindEmployeesByQualificationResponse
> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,
    ) {}

    async execute(query: FindEmployeesByQualificationQuery): Promise<FindEmployeesByQualificationResponse> {
        const employees = await this.employeeRepo.findByPositionAndQualifications(
            query.positionKey,
            query.qualificationFilters,
        );

        return {
            employees: employees.map((employee) => {
                const assignment = employee.positionAssignments.find((pa) => pa.positionKey === query.positionKey);

                return {
                    employeeId: employee.id as string,
                    userId: employee.userId,
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    qualifications: (assignment?.qualifications ?? []).map((q) => ({
                        key: q.key,
                        type: q.type,
                        value: q.value,
                    })),
                };
            }),
        };
    }
}
