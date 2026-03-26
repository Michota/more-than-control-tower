import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
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
import { ListSystemUsersQuery, ListSystemUsersResponse } from "./queries/list-system-users/list-system-users.query.js";
import { ListSystemUsersRequestDto } from "./queries/list-system-users/list-system-users.request.dto.js";

@Controller("system-user")
export class SystemHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async createUser(@Body() body: CreateSystemUserRequest): Promise<{ userId: string }> {
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
    async suspendUser(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new SuspendSystemUserCommand({ userId: id }));
    }

    @Patch(":id/activate")
    async activateUser(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ActivateSystemUserCommand({ userId: id }));
    }

    @Get()
    async listUsers(@Query() dto: ListSystemUsersRequestDto): Promise<ListSystemUsersResponse> {
        return this.queryBus.execute(new ListSystemUsersQuery(dto.query, dto.page, dto.limit));
    }

    @Get(":id")
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
