import { databaseConfig, generateMikroOrmOptions, validate } from "../config/index";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { HrModule } from "../modules/hr/hr.module.js";
import { SystemModule } from "../modules/system/system.module.js";
import { DeleteEmployeeCliCommand } from "./hr/delete-employee.command.js";
import { CreateAdminCliCommand } from "./system/create-admin.command.js";
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
        HrModule,
        SystemModule,
    ],
    providers: [DeleteEmployeeCliCommand, CreateAdminCliCommand, UpdateAdminCliCommand],
})
export class CliModule {}
