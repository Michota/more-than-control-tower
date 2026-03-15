import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigType } from "@nestjs/config";
import databaseConfig from "./config/database.config";
import { generateMikroOrmOptions } from "./config/mikro-orm.config";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
        MikroOrmModule.forRootAsync({
            useFactory: (config: ConfigType<typeof databaseConfig>) => generateMikroOrmOptions(config),
            inject: [databaseConfig.KEY],
        }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
