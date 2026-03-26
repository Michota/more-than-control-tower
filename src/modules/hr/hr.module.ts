import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { CreateEmployeeCommandHandler } from "./commands/create-employee/create-employee.command-handler.js";
import { UpdateEmployeeCommandHandler } from "./commands/update-employee/update-employee.command-handler.js";
import { LinkEmployeeToUserCommandHandler } from "./commands/link-employee-to-user/link-employee-to-user.command-handler.js";
import { AssignPositionCommandHandler } from "./commands/assign-position/assign-position.command-handler.js";
import { UnassignPositionCommandHandler } from "./commands/unassign-position/unassign-position.command-handler.js";
import { DeactivateEmployeeCommandHandler } from "./commands/deactivate-employee/deactivate-employee.command-handler.js";
import { SetPermissionOverrideCommandHandler } from "./commands/set-permission-override/set-permission-override.command-handler.js";
import { GetEmployeeQueryHandler } from "./queries/get-employee/get-employee.query-handler.js";
import { FindEmployeesByQualificationQueryHandler } from "./queries/find-employees-by-qualification/find-employees-by-qualification.query-handler.js";
import {
    GetEmployeePermissionsQueryHandler,
    POSITION_PERMISSIONS,
} from "./queries/get-employee-permissions/get-employee-permissions.query-handler.js";
import { ListEmployeesQueryHandler } from "./queries/list-employees/list-employees.query-handler.js";
import { HrHttpController } from "./hr.http.controller.js";
import { Employee } from "./database/employee.entity.js";
import { PositionAssignment } from "./database/position-assignment.entity.js";
import { PermissionOverride } from "./database/permission-override.entity.js";
import { EmployeeMapper } from "./database/employee.mapper.js";
import { EmployeeRepository } from "./database/employee.repository.js";
import { EMPLOYEE_REPOSITORY_PORT } from "./hr.di-tokens.js";

/**
 * Position→permission mapping owned by HR module.
 * This determines which permissions each position grants.
 * Initially empty — populated as modules define their positions and permissions.
 */
const positionPermissionsMap = new Map<string, readonly string[]>([
    // Example (uncomment when modules define their permissions):
    // ["freight:driver", ["freight:view-routes", "freight:execute-route"]],
    // ["warehouse:worker", ["warehouse:create-receipt", "warehouse:view-stock"]],
]);

@Module({
    imports: [MikroOrmModule.forFeature([Employee, PositionAssignment, PermissionOverride])],
    controllers: [HrHttpController],
    providers: [
        EmployeeMapper,
        CreateEmployeeCommandHandler,
        UpdateEmployeeCommandHandler,
        LinkEmployeeToUserCommandHandler,
        AssignPositionCommandHandler,
        UnassignPositionCommandHandler,
        DeactivateEmployeeCommandHandler,
        SetPermissionOverrideCommandHandler,
        GetEmployeeQueryHandler,
        FindEmployeesByQualificationQueryHandler,
        GetEmployeePermissionsQueryHandler,
        ListEmployeesQueryHandler,
        {
            provide: EMPLOYEE_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new EmployeeRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
        {
            provide: POSITION_PERMISSIONS,
            useValue: positionPermissionsMap,
        },
    ],
})
export class HrModule {}
