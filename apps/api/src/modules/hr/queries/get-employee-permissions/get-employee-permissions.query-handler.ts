import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import type { PositionRepositoryPort } from "../../database/position.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT, POSITION_REPOSITORY_PORT } from "../../hr.di-tokens.js";

@QueryHandler(GetEmployeePermissionsQuery)
export class GetEmployeePermissionsQueryHandler implements IQueryHandler<
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse | null
> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(POSITION_REPOSITORY_PORT)
        private readonly positionRepo: PositionRepositoryPort,
    ) {}

    async execute(query: GetEmployeePermissionsQuery): Promise<GetEmployeePermissionsResponse | null> {
        const employee = await this.employeeRepo.findByUserId(query.userId);
        if (!employee) {
            return null;
        }

        const positionPermissions = new Map<string, readonly string[]>();
        for (const assignment of employee.positionAssignments) {
            const position = await this.positionRepo.findByKey(assignment.positionKey);
            if (position) {
                positionPermissions.set(position.key, position.permissionKeys);
            }
        }

        const effectivePermissions = employee.getEffectivePermissions(positionPermissions);

        return {
            userId: query.userId,
            effectivePermissions,
            positionKeys: employee.positionAssignments.map((pa) => pa.positionKey),
        };
    }
}
