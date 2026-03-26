import { QueryBus } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { AuthorizationPort } from "./authorization.port.js";
import { GetSystemUserQuery, GetSystemUserResponse } from "../queries/get-system-user.query.js";
import {
    GetEmployeePermissionsQuery,
    GetEmployeePermissionsResponse,
} from "../queries/get-employee-permissions.query.js";

/**
 * Authorization adapter backed by HR and System modules (ADR-015, Phase 2).
 *
 * Resolution order:
 * 1. Query System module for the user's system roles.
 *    If the user has the "administrator" role → permit any action.
 * 2. Otherwise, query HR for the user's effective permissions
 *    (position defaults + per-user overrides) and check if the action is included.
 * 3. If the user is unknown to both System and HR → deny.
 */
@Injectable()
export class HrAuthorizationAdapter implements AuthorizationPort {
    constructor(private readonly queryBus: QueryBus) {}

    async canPerform(userId: string, action: string): Promise<boolean> {
        const systemUser = await this.getSystemUser(userId);

        if (systemUser?.roles.includes("administrator")) {
            return true;
        }

        const permissions = await this.getEmployeePermissions(userId);
        if (!permissions) {
            return false;
        }

        return permissions.effectivePermissions.includes(action);
    }

    private async getSystemUser(userId: string): Promise<GetSystemUserResponse | null> {
        try {
            return await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
                new GetSystemUserQuery(userId),
            );
        } catch {
            return null;
        }
    }

    private async getEmployeePermissions(userId: string): Promise<GetEmployeePermissionsResponse | null> {
        try {
            return await this.queryBus.execute<GetEmployeePermissionsQuery, GetEmployeePermissionsResponse | null>(
                new GetEmployeePermissionsQuery(userId),
            );
        } catch {
            return null;
        }
    }
}
