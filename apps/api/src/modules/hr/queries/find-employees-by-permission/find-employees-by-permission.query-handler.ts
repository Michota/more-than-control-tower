import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    FindEmployeesByPermissionQuery,
    FindEmployeesByPermissionResponse,
} from "../../../../shared/queries/find-employees-by-permission.query.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import type { PositionRepositoryPort } from "../../database/position.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT, POSITION_REPOSITORY_PORT } from "../../hr.di-tokens.js";
import { EmployeeStatus } from "../../domain/employee-status.enum.js";

@QueryHandler(FindEmployeesByPermissionQuery)
export class FindEmployeesByPermissionQueryHandler implements IQueryHandler<
    FindEmployeesByPermissionQuery,
    FindEmployeesByPermissionResponse
> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(POSITION_REPOSITORY_PORT)
        private readonly positionRepo: PositionRepositoryPort,
    ) {}

    async execute(query: FindEmployeesByPermissionQuery): Promise<FindEmployeesByPermissionResponse> {
        const allPositions = await this.positionRepo.findAll();
        const positionPermissions = new Map(allPositions.map((p) => [p.key, p.permissionKeys] as const));

        const allEmployees = await this.employeeRepo.findAll();

        const matchingEmployees = allEmployees.filter((employee) => {
            if (employee.status !== EmployeeStatus.ACTIVE) {
                return false;
            }

            const effectivePermissions = employee.getEffectivePermissions(positionPermissions);
            return effectivePermissions.includes(query.permissionKey);
        });

        return {
            employees: matchingEmployees.map((employee) => ({
                employeeId: employee.id as string,
                userId: employee.userId,
                firstName: employee.firstName,
                lastName: employee.lastName,
            })),
        };
    }
}
