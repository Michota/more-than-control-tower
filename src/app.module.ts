import { databaseConfig, generateMikroOrmOptions, validate } from "./config/index";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { CrmModule } from "./modules/crm/crm.module.js";
import { SalesModule } from "./modules/sales/sales.module.js";
import { WarehouseModule } from "./modules/warehouse/warehouse.module.js";
import { HrModule } from "./modules/hr/hr.module.js";
import { SystemModule } from "./modules/system/system.module.js";
import { CqrsModule } from "@nestjs/cqrs";

@Module({
    imports: [
        // Configuration modules
        ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig], validate }),
        MikroOrmModule.forRootAsync({
            useFactory: (config: ConfigType<typeof databaseConfig>) => generateMikroOrmOptions(config),
            inject: [databaseConfig.KEY],
        }),
        CqrsModule.forRoot(),

        // Modules
        CrmModule,
        SalesModule,
        WarehouseModule,
        HrModule,
        SystemModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
