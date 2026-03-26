import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../../../../shared/queries/get-employee-permissions.query.js";
import type { EmployeeRepositoryPort } from "../../database/employee.repository.port.js";
import { EMPLOYEE_REPOSITORY_PORT } from "../../hr.di-tokens.js";

/**
 * Resolves effective permissions for a user.
 *
 * The position→permission mapping is injected via the POSITION_PERMISSIONS token,
 * which HR module owns. This mapping determines which permissions each position grants.
 */
export const POSITION_PERMISSIONS = Symbol("PositionPermissions");

@QueryHandler(GetEmployeePermissionsQuery)
export class GetEmployeePermissionsQueryHandler implements IQueryHandler<
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse | null
> {
    constructor(
        @Inject(EMPLOYEE_REPOSITORY_PORT)
        private readonly employeeRepo: EmployeeRepositoryPort,

        @Inject(POSITION_PERMISSIONS)
        private readonly positionPermissions: ReadonlyMap<string, readonly string[]>,
    ) {}

    async execute(query: GetEmployeePermissionsQuery): Promise<GetEmployeePermissionsResponse | null> {
        const employee = await this.employeeRepo.findByUserId(query.userId);
        if (!employee) {
            return null;
        }

        const effectivePermissions = employee.getEffectivePermissions(this.positionPermissions);

        return {
            userId: query.userId,
            effectivePermissions,
            positionKeys: employee.positionAssignments.map((pa) => pa.positionKey),
        };
    }
}
