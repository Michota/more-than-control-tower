import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { type UUID } from "crypto";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../shared/queries/get-system-user.query.js";
import { CreateSystemUserCommand } from "./commands/create-system-user/create-system-user.command.js";
import { CreateSystemUserRequest } from "./commands/create-system-user/create-system-user.request.dto.js";
import { UpdateSystemUserCommand } from "./commands/update-system-user/update-system-user.command.js";
import { UpdateSystemUserRequest } from "./commands/update-system-user/update-system-user.request.dto.js";
import { AssignRolesCommand } from "./commands/assign-roles/assign-roles.command.js";
import { AssignRolesRequest } from "./commands/assign-roles/assign-roles.request.dto.js";
import { SuspendSystemUserCommand } from "./commands/suspend-system-user/suspend-system-user.command.js";
import { ActivateSystemUserCommand } from "./commands/activate-system-user/activate-system-user.command.js";
import { ListSystemUsersQuery } from "./queries/list-system-users/list-system-users.query.js";
import { ListSystemUsersRequestDto } from "./queries/list-system-users/list-system-users.request.dto.js";
import {
    SystemUserIdResponseDto,
    SystemUserListResponseDto,
    SystemUserResponseDto,
} from "./dtos/system-user.response.dto.js";

@ApiTags("System Users")
@Controller("system-user")
export class SystemHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    @ApiOperation({ summary: "Create a new system user" })
    @ApiResponse({ status: 201, type: SystemUserIdResponseDto })
    async createUser(@Body() body: CreateSystemUserRequest): Promise<SystemUserIdResponseDto> {
        const userId = await this.commandBus.execute(
            new CreateSystemUserCommand({
                email: body.email,
                firstName: body.firstName,
                lastName: body.lastName,
                roles: body.roles,
            }),
        );
        return { userId };
    }

    @Patch(":id")
    @ApiOperation({ summary: "Update system user profile (email, name)" })
    @ApiResponse({ status: 200 })
    async updateUser(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: UpdateSystemUserRequest): Promise<void> {
        await this.commandBus.execute(
            new UpdateSystemUserCommand({
                userId: id,
                email: body.email,
                firstName: body.firstName,
                lastName: body.lastName,
            }),
        );
    }

    @Patch(":id/roles")
    @ApiOperation({ summary: "Assign roles to a system user" })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 409, description: "Cannot remove the last active administrator" })
    async assignRoles(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: AssignRolesRequest): Promise<void> {
        // TODO: extract actorId from auth context when auth is implemented
        await this.commandBus.execute(
            new AssignRolesCommand({
                userId: id,
                roles: body.roles,
                actorId: "unknown",
            }),
        );
    }

    @Patch(":id/suspend")
    @ApiOperation({ summary: "Suspend a system user (soft-delete)" })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 409, description: "Cannot suspend the last active administrator" })
    async suspendUser(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new SuspendSystemUserCommand({ userId: id }));
    }

    @Patch(":id/activate")
    @ApiOperation({ summary: "Activate a system user" })
    @ApiResponse({ status: 200 })
    async activateUser(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ActivateSystemUserCommand({ userId: id }));
    }

    @Get()
    @ApiOperation({ summary: "List system users (with optional search)" })
    @ApiResponse({ status: 200, type: SystemUserListResponseDto })
    async listUsers(@Query() dto: ListSystemUsersRequestDto): Promise<SystemUserListResponseDto> {
        return this.queryBus.execute(new ListSystemUsersQuery(dto.query, dto.page, dto.limit));
    }

    @Get(":id")
    @ApiOperation({ summary: "Get a system user by ID" })
    @ApiResponse({ status: 200, type: SystemUserResponseDto })
    @ApiResponse({ status: 404, description: "System user not found" })
    async getUser(@Param("id", ParseUUIDPipe) id: UUID): Promise<GetSystemUserResponse> {
        const user = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(id),
        );
        if (!user) {
            throw new NotFoundException(`System user ${id} not found`);
        }
        return user;
    }
}
