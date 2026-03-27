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
import { DeleteEmployeeCommandHandler } from "./commands/delete-employee/delete-employee.command-handler.js";
import { CreatePositionCommandHandler } from "./commands/create-position/create-position.command-handler.js";
import { UpdatePositionCommandHandler } from "./commands/update-position/update-position.command-handler.js";
import { GetEmployeeQueryHandler } from "./queries/get-employee/get-employee.query-handler.js";
import { FindEmployeesByPermissionQueryHandler } from "./queries/find-employees-by-permission/find-employees-by-permission.query-handler.js";
import { GetEmployeePermissionsQueryHandler } from "./queries/get-employee-permissions/get-employee-permissions.query-handler.js";
import { ListEmployeesQueryHandler } from "./queries/list-employees/list-employees.query-handler.js";
import { ListPositionsQueryHandler } from "./queries/list-positions/list-positions.query-handler.js";
import { HrHttpController } from "./hr.http.controller.js";
import { Employee } from "./database/employee.entity.js";
import { PositionAssignment } from "./database/position-assignment.entity.js";
import { PermissionOverride } from "./database/permission-override.entity.js";
import { Position } from "./database/position.entity.js";
import { EmployeeMapper } from "./database/employee.mapper.js";
import { PositionMapper } from "./database/position.mapper.js";
import { EmployeeRepository } from "./database/employee.repository.js";
import { PositionRepository } from "./database/position.repository.js";
import { EMPLOYEE_REPOSITORY_PORT, POSITION_REPOSITORY_PORT } from "./hr.di-tokens.js";

@Module({
    imports: [MikroOrmModule.forFeature([Employee, PositionAssignment, PermissionOverride, Position])],
    controllers: [HrHttpController],
    providers: [
        EmployeeMapper,
        PositionMapper,
        // Employee commands
        CreateEmployeeCommandHandler,
        UpdateEmployeeCommandHandler,
        LinkEmployeeToUserCommandHandler,
        AssignPositionCommandHandler,
        UnassignPositionCommandHandler,
        DeactivateEmployeeCommandHandler,
        SetPermissionOverrideCommandHandler,
        DeleteEmployeeCommandHandler,
        // Position commands
        CreatePositionCommandHandler,
        UpdatePositionCommandHandler,
        // Queries
        GetEmployeeQueryHandler,
        FindEmployeesByPermissionQueryHandler,
        GetEmployeePermissionsQueryHandler,
        ListEmployeesQueryHandler,
        ListPositionsQueryHandler,
        // Ports
        {
            provide: EMPLOYEE_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new EmployeeRepository(em),
            inject: [EntityManager],
        },
        {
            provide: POSITION_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new PositionRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
    ],
})
export class HrModule {}
