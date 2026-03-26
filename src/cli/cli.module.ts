import { databaseConfig, generateMikroOrmOptions, validate } from "../config/index";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { CrmModule } from "../modules/crm/crm.module.js";
import { HrModule } from "../modules/hr/hr.module.js";
import { SystemModule } from "../modules/system/system.module.js";
import { SearchCustomersCliCommand } from "./crm/search-customers.command.js";
import { DeactivateEmployeeCliCommand } from "./hr/deactivate-employee.command.js";
import { DeleteEmployeeCliCommand } from "./hr/delete-employee.command.js";
import { ListEmployeesCliCommand } from "./hr/list-employees.command.js";
import { ActivateUserCliCommand } from "./system/activate-user.command.js";
import { CreateAdminCliCommand } from "./system/create-admin.command.js";
import { ListUsersCliCommand } from "./system/list-users.command.js";
import { SuspendUserCliCommand } from "./system/suspend-user.command.js";
import { UpdateAdminCliCommand } from "./system/update-admin.command.js";

/**
 * CLI module — bootstraps the same infrastructure as AppModule
 * but without HTTP controllers. Only registers CLI commands
 * and the modules they depend on.
 */
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig], validate }),
        MikroOrmModule.forRootAsync({
            useFactory: (config: ConfigType<typeof databaseConfig>) => generateMikroOrmOptions(config),
            inject: [databaseConfig.KEY],
        }),
        CqrsModule.forRoot(),
        CrmModule,
        HrModule,
        SystemModule,
    ],
    providers: [
        // System
        CreateAdminCliCommand,
        UpdateAdminCliCommand,
        ListUsersCliCommand,
        SuspendUserCliCommand,
        ActivateUserCliCommand,
        // HR
        DeleteEmployeeCliCommand,
        DeactivateEmployeeCliCommand,
        ListEmployeesCliCommand,
        // CRM
        SearchCustomersCliCommand,
    ],
})
export class CliModule {}
