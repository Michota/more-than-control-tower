import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { type UUID } from "crypto";
import { GetEmployeeQuery, GetEmployeeResponse } from "../../shared/queries/get-employee.query.js";
import { CreateEmployeeCommand } from "./commands/create-employee/create-employee.command.js";
import { CreateEmployeeRequest } from "./commands/create-employee/create-employee.request.dto.js";
import { UpdateEmployeeCommand } from "./commands/update-employee/update-employee.command.js";
import { UpdateEmployeeRequest } from "./commands/update-employee/update-employee.request.dto.js";
import { LinkEmployeeToUserCommand } from "./commands/link-employee-to-user/link-employee-to-user.command.js";
import { LinkEmployeeToUserRequest } from "./commands/link-employee-to-user/link-employee-to-user.request.dto.js";
import { AssignPositionCommand } from "./commands/assign-position/assign-position.command.js";
import { AssignPositionRequest } from "./commands/assign-position/assign-position.request.dto.js";
import { UnassignPositionCommand } from "./commands/unassign-position/unassign-position.command.js";
import { DeactivateEmployeeCommand } from "./commands/deactivate-employee/deactivate-employee.command.js";
import { SetPermissionOverrideCommand } from "./commands/set-permission-override/set-permission-override.command.js";
import { SetPermissionOverrideRequest } from "./commands/set-permission-override/set-permission-override.request.dto.js";
import { CreatePositionCommand } from "./commands/create-position/create-position.command.js";
import { CreatePositionRequest } from "./commands/create-position/create-position.request.dto.js";
import { UpdatePositionCommand } from "./commands/update-position/update-position.command.js";
import { ListEmployeesQuery } from "./queries/list-employees/list-employees.query.js";
import { ListEmployeesRequestDto } from "./queries/list-employees/list-employees.request.dto.js";
import { type ListEmployeesResponse } from "./queries/list-employees/list-employees.query-handler.js";
import { ListPositionsQuery } from "./queries/list-positions/list-positions.query.js";
import { type ListPositionsResponse } from "./queries/list-positions/list-positions.query-handler.js";

@Controller("employees")
export class HrHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    // ─── Positions ───────────────────────────────────────────

    @Post("positions")
    async createPosition(@Body() body: CreatePositionRequest): Promise<{ positionId: string }> {
        const positionId = await this.commandBus.execute(
            new CreatePositionCommand({
                key: body.key,
                displayName: body.displayName,
                permissionKeys: body.permissionKeys,
            }),
        );
        return { positionId };
    }

    @Patch("positions/:id")
    async updatePosition(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: CreatePositionRequest): Promise<void> {
        await this.commandBus.execute(
            new UpdatePositionCommand({
                positionId: id,
                displayName: body.displayName,
                permissionKeys: body.permissionKeys,
            }),
        );
    }

    @Get("positions")
    async listPositions(): Promise<ListPositionsResponse> {
        return this.queryBus.execute(new ListPositionsQuery());
    }

    // ─── Employees ───────────────────────────────────────────

    @Post()
    async createEmployee(@Body() body: CreateEmployeeRequest): Promise<{ employeeId: string }> {
        const employeeId = await this.commandBus.execute(
            new CreateEmployeeCommand({
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                phone: body.phone,
                userId: body.userId,
                skipUniquenessCheck: body.skipUniquenessCheck,
            }),
        );
        return { employeeId };
    }

    @Patch(":id")
    async updateEmployee(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: UpdateEmployeeRequest): Promise<void> {
        await this.commandBus.execute(
            new UpdateEmployeeCommand({
                employeeId: id,
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                phone: body.phone,
            }),
        );
    }

    @Post(":id/link-user")
    async linkToUser(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: LinkEmployeeToUserRequest): Promise<void> {
        await this.commandBus.execute(
            new LinkEmployeeToUserCommand({
                employeeId: id,
                userId: body.userId,
            }),
        );
    }

    @Post(":id/positions")
    async assignPosition(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: AssignPositionRequest): Promise<void> {
        await this.commandBus.execute(
            new AssignPositionCommand({
                employeeId: id,
                positionKey: body.positionKey,
                assignedBy: body.assignedBy,
            }),
        );
    }

    @Delete(":id/positions/:positionKey")
    async unassignPosition(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Param("positionKey") positionKey: string,
    ): Promise<void> {
        await this.commandBus.execute(
            new UnassignPositionCommand({
                employeeId: id,
                positionKey,
            }),
        );
    }

    @Post(":id/deactivate")
    async deactivateEmployee(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new DeactivateEmployeeCommand({ employeeId: id }));
    }

    @Post(":id/permission-overrides")
    async setPermissionOverrides(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: SetPermissionOverrideRequest,
    ): Promise<void> {
        await this.commandBus.execute(
            new SetPermissionOverrideCommand({
                employeeId: id,
                overrides: body.overrides.map((o) => ({
                    permissionKey: o.permissionKey,
                    state: o.state ?? null,
                })),
            }),
        );
    }

    @Get(":id")
    async getEmployee(@Param("id", ParseUUIDPipe) id: UUID): Promise<GetEmployeeResponse> {
        const employee = await this.queryBus.execute<GetEmployeeQuery, GetEmployeeResponse | null>(
            new GetEmployeeQuery(id),
        );
        if (!employee) {
            throw new NotFoundException(`Employee ${id} not found`);
        }
        return employee;
    }

    @Get()
    async listEmployees(@Query() dto: ListEmployeesRequestDto): Promise<ListEmployeesResponse> {
        return this.queryBus.execute(new ListEmployeesQuery(dto.page, dto.limit, dto.positionKey, dto.status));
    }
}
