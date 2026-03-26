import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { CreateSystemUserCommandHandler } from "./commands/create-system-user/create-system-user.command-handler.js";
import { UpdateSystemUserCommandHandler } from "./commands/update-system-user/update-system-user.command-handler.js";
import { AssignRolesCommandHandler } from "./commands/assign-roles/assign-roles.command-handler.js";
import { SuspendSystemUserCommandHandler } from "./commands/suspend-system-user/suspend-system-user.command-handler.js";
import { ActivateSystemUserCommandHandler } from "./commands/activate-system-user/activate-system-user.command-handler.js";
import { GetSystemUserQueryHandler } from "./queries/get-system-user/get-system-user.query-handler.js";
import { ListSystemUsersQueryHandler } from "./queries/list-system-users/list-system-users.query-handler.js";
import { SystemHttpController } from "./system.http.controller.js";
import { SystemUser } from "./database/system-user.entity.js";
import { SystemUserMapper } from "./database/system-user.mapper.js";
import { SystemUserRepository } from "./database/system-user.repository.js";
import { SYSTEM_USER_REPOSITORY_PORT } from "./system.di-tokens.js";

@Module({
    imports: [MikroOrmModule.forFeature([SystemUser])],
    controllers: [SystemHttpController],
    providers: [
        SystemUserMapper,
        CreateSystemUserCommandHandler,
        UpdateSystemUserCommandHandler,
        AssignRolesCommandHandler,
        SuspendSystemUserCommandHandler,
        ActivateSystemUserCommandHandler,
        GetSystemUserQueryHandler,
        ListSystemUsersQueryHandler,
        {
            provide: SYSTEM_USER_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new SystemUserRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
    ],
})
export class SystemModule {}
