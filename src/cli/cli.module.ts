import { databaseConfig, generateMikroOrmOptions, validate } from "../config/index";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { CrmModule } from "../modules/crm/crm.module.js";
import { HrModule } from "../modules/hr/hr.module.js";
import { SystemModule } from "../modules/system/system.module.js";
import { SearchCustomersCliCommand } from "../modules/crm/cli/search-customers.command.js";
import { DeactivateEmployeeCliCommand } from "../modules/hr/cli/deactivate-employee.command.js";
import { DeleteEmployeeCliCommand } from "../modules/hr/cli/delete-employee.command.js";
import { ListEmployeesCliCommand } from "../modules/hr/cli/list-employees.command.js";
import { ActivateUserCliCommand } from "../modules/system/cli/activate-user.command.js";
import { CreateAdminCliCommand } from "../modules/system/cli/create-admin.command.js";
import { ListUsersCliCommand } from "../modules/system/cli/list-users.command.js";
import { SuspendUserCliCommand } from "../modules/system/cli/suspend-user.command.js";
import { UpdateAdminCliCommand } from "../modules/system/cli/update-admin.command.js";

/**
 * CLI module — bootstraps the same infrastructure as AppModule
 * but without HTTP controllers. Only registers CLI commands
 * and the modules they depend on.
 */
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig], validate }),
        MikroOrmModule.forRootAsync({
            useFactory: (config: ConfigType<typeof databaseConfig>) => ({
                ...generateMikroOrmOptions(config),
                allowGlobalContext: true,
            }),
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
