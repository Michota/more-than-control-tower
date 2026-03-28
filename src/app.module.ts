import { databaseConfig, generateMikroOrmOptions, validate } from "./config/index";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { CrmModule } from "./modules/crm/crm.module.js";
import { SalesModule } from "./modules/sales/sales.module.js";
import { WarehouseModule } from "./modules/warehouse/warehouse.module.js";
import { HrModule } from "./modules/hr/hr.module.js";
import { SystemModule } from "./modules/system/system.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { FreightModule } from "./modules/freight/freight.module.js";
import { CqrsModule } from "@nestjs/cqrs";
import { PermissionRegistryModule } from "./shared/infrastructure/permission-registry.module.js";
import { StockReservationCheckerModule } from "./shared/infrastructure/stock-reservation-checker.module.js";
import { JwtAuthGuard } from "./shared/auth/guards/jwt-auth.guard.js";

@Module({
    imports: [
        // Configuration modules
        ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig], validate }),
        MikroOrmModule.forRootAsync({
            useFactory: (config: ConfigType<typeof databaseConfig>) => generateMikroOrmOptions(config),
            inject: [databaseConfig.KEY],
        }),
        CqrsModule.forRoot(),
        ThrottlerModule.forRoot({
            throttlers: [{ ttl: 60_000, limit: 10 }],
        }),
        PermissionRegistryModule,
        StockReservationCheckerModule,

        // Modules
        AuthModule,
        CrmModule,
        SalesModule,
        WarehouseModule,
        FreightModule,
        HrModule,
        SystemModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}
