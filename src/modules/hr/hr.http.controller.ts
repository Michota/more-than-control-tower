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
    Put,
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
import { CurrentUser, type RequestUser } from "../../shared/auth/decorators/current-user.decorator.js";
import { AssignPositionCommand } from "./commands/assign-position/assign-position.command.js";
import { AssignPositionRequest } from "./commands/assign-position/assign-position.request.dto.js";
import { UnassignPositionCommand } from "./commands/unassign-position/unassign-position.command.js";
import { DeactivateEmployeeCommand } from "./commands/deactivate-employee/deactivate-employee.command.js";
import { SetPermissionOverrideCommand } from "./commands/set-permission-override/set-permission-override.command.js";
import { SetPermissionOverrideRequest } from "./commands/set-permission-override/set-permission-override.request.dto.js";
import { SetAvailabilityCommand } from "./commands/set-availability/set-availability.command.js";
import { SetAvailabilityRequest } from "./commands/set-availability/set-availability.request.dto.js";
import { ConfirmAvailabilityCommand } from "./commands/confirm-availability/confirm-availability.command.js";
import { ConfirmAvailabilityRequest } from "./commands/confirm-availability/confirm-availability.request.dto.js";
import { RejectAvailabilityCommand } from "./commands/reject-availability/reject-availability.command.js";
import { RejectAvailabilityRequest } from "./commands/reject-availability/reject-availability.request.dto.js";
import { LockAvailabilityCommand } from "./commands/lock-availability/lock-availability.command.js";
import { LockAvailabilityRequest } from "./commands/lock-availability/lock-availability.request.dto.js";
import { CreatePositionCommand } from "./commands/create-position/create-position.command.js";
import { CreatePositionRequest } from "./commands/create-position/create-position.request.dto.js";
import { UpdatePositionCommand } from "./commands/update-position/update-position.command.js";
import { ListEmployeesQuery } from "./queries/list-employees/list-employees.query.js";
import { ListEmployeesRequestDto } from "./queries/list-employees/list-employees.request.dto.js";
import { type ListEmployeesResponse } from "./queries/list-employees/list-employees.query-handler.js";
import { ListPositionsQuery } from "./queries/list-positions/list-positions.query.js";
import { type ListPositionsResponse } from "./queries/list-positions/list-positions.query-handler.js";
import { GetEmployeeAvailabilityQuery } from "./queries/get-employee-availability/get-employee-availability.query.js";
import { GetEmployeeAvailabilityRequestDto } from "./queries/get-employee-availability/get-employee-availability.request.dto.js";
import { type GetEmployeeAvailabilityResponse } from "./queries/get-employee-availability/get-employee-availability.query-handler.js";
import {
    GetEmployeePermissionsQuery,
    type GetEmployeePermissionsResponse,
} from "../../shared/queries/get-employee-permissions.query.js";

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
    async assignPosition(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: AssignPositionRequest,
        @CurrentUser() user: RequestUser,
    ): Promise<void> {
        await this.commandBus.execute(
            new AssignPositionCommand({
                employeeId: id,
                positionKey: body.positionKey,
                assignedBy: user.userId,
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

    // ─── Availability ────────────────────────────────────────

    @Put(":id/availability")
    async setAvailability(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: SetAvailabilityRequest,
        @CurrentUser() user: RequestUser,
    ): Promise<void> {
        const permissions = await this.queryBus.execute<
            GetEmployeePermissionsQuery,
            GetEmployeePermissionsResponse | null
        >(new GetEmployeePermissionsQuery(user.userId));
        const canManage = permissions?.effectivePermissions.includes("hr:manage-availability") ?? false;

        await this.commandBus.execute(
            new SetAvailabilityCommand({
                employeeId: id,
                entries: body.entries,
                setByManager: canManage,
            }),
        );
    }

    @Post(":id/availability/confirm")
    async confirmAvailability(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: ConfirmAvailabilityRequest,
    ): Promise<void> {
        await this.commandBus.execute(
            new ConfirmAvailabilityCommand({
                employeeId: id,
                dates: body.dates,
            }),
        );
    }

    @Post(":id/availability/reject")
    async rejectAvailability(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: RejectAvailabilityRequest,
    ): Promise<void> {
        await this.commandBus.execute(
            new RejectAvailabilityCommand({
                employeeId: id,
                dates: body.dates,
            }),
        );
    }

    @Post(":id/availability/lock")
    async lockAvailability(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: LockAvailabilityRequest): Promise<void> {
        await this.commandBus.execute(
            new LockAvailabilityCommand({
                employeeId: id,
                dates: body.dates,
            }),
        );
    }

    @Get(":id/availability")
    async getEmployeeAvailability(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Query() dto: GetEmployeeAvailabilityRequestDto,
    ): Promise<GetEmployeeAvailabilityResponse> {
        return this.queryBus.execute(new GetEmployeeAvailabilityQuery(id, dto.fromDate, dto.toDate));
    }
}
