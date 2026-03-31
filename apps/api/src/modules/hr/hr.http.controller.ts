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
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
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
    EmployeeResponseDto,
    EmployeeIdResponseDto,
    PaginatedEmployeesResponseDto,
} from "./dtos/employee.response.dto.js";
import { PositionIdResponseDto, ListPositionsResponseDto } from "./dtos/position.response.dto.js";
import { GetEmployeeAvailabilityResponseDto } from "./dtos/availability.response.dto.js";

@ApiTags("HR")
@Controller("employees")
export class HrHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    // ─── Positions ───────────────────────────────────────────

    @Post("positions")
    @ApiOperation({ summary: "Create a new position" })
    @ApiResponse({ status: 201, type: PositionIdResponseDto })
    async createPosition(@Body() body: CreatePositionRequest): Promise<PositionIdResponseDto> {
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
    @ApiOperation({ summary: "Update a position" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "List all positions" })
    @ApiResponse({ status: 200, type: ListPositionsResponseDto })
    async listPositions(): Promise<ListPositionsResponse> {
        return this.queryBus.execute(new ListPositionsQuery());
    }

    // ─── Employees ───────────────────────────────────────────

    @Post()
    @ApiOperation({ summary: "Create a new employee" })
    @ApiResponse({ status: 201, type: EmployeeIdResponseDto })
    async createEmployee(@Body() body: CreateEmployeeRequest): Promise<EmployeeIdResponseDto> {
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
    @ApiOperation({ summary: "Update an employee" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "Link an employee to a system user" })
    @ApiResponse({ status: 200 })
    async linkToUser(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: LinkEmployeeToUserRequest): Promise<void> {
        await this.commandBus.execute(
            new LinkEmployeeToUserCommand({
                employeeId: id,
                userId: body.userId,
            }),
        );
    }

    @Post(":id/positions")
    @ApiOperation({ summary: "Assign a position to an employee" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "Unassign a position from an employee" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "Deactivate an employee" })
    @ApiResponse({ status: 200 })
    async deactivateEmployee(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new DeactivateEmployeeCommand({ employeeId: id }));
    }

    @Post(":id/permission-overrides")
    @ApiOperation({ summary: "Set permission overrides for an employee" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "Get employee details" })
    @ApiResponse({ status: 200, type: EmployeeResponseDto })
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
    @ApiOperation({ summary: "List employees (paginated)" })
    @ApiResponse({ status: 200, type: PaginatedEmployeesResponseDto })
    async listEmployees(@Query() dto: ListEmployeesRequestDto): Promise<ListEmployeesResponse> {
        return this.queryBus.execute(new ListEmployeesQuery(dto.page, dto.limit, dto.positionKey, dto.status));
    }

    // ─── Availability ────────────────────────────────────────

    @Put(":id/availability")
    @ApiOperation({ summary: "Set availability entries for an employee" })
    @ApiResponse({ status: 200 })
    async setAvailability(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: SetAvailabilityRequest,
        @CurrentUser() user: RequestUser,
    ): Promise<void> {
        await this.commandBus.execute(
            new SetAvailabilityCommand({
                employeeId: id,
                entries: body.entries,
                actorId: user.userId,
            }),
        );
    }

    @Post(":id/availability/confirm")
    @ApiOperation({ summary: "Confirm availability entries" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "Reject availability entries" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "Lock availability entries" })
    @ApiResponse({ status: 200 })
    async lockAvailability(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: LockAvailabilityRequest): Promise<void> {
        await this.commandBus.execute(
            new LockAvailabilityCommand({
                employeeId: id,
                dates: body.dates,
            }),
        );
    }

    @Get(":id/availability")
    @ApiOperation({ summary: "Get employee availability entries" })
    @ApiResponse({ status: 200, type: GetEmployeeAvailabilityResponseDto })
    async getEmployeeAvailability(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Query() dto: GetEmployeeAvailabilityRequestDto,
    ): Promise<GetEmployeeAvailabilityResponse> {
        return this.queryBus.execute(new GetEmployeeAvailabilityQuery(id, dto.fromDate, dto.toDate));
    }
}
