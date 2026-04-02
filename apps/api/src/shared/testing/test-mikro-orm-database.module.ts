import { MikroOrmModule } from "@mikro-orm/nestjs";
import "dotenv/config";
import { env } from "../../config/env";
import { generateMikroOrmOptions } from "../../config/generate-mikro-orm.config.js";

export function TestMikroOrmDatabaseModule() {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, TEST_DB_NAME } = env;

    return MikroOrmModule.forRoot({
        ...generateMikroOrmOptions({
            host: DB_HOST,
            port: Number(DB_PORT),
            user: DB_USER,
            password: DB_PASSWORD,
            dbName: TEST_DB_NAME,
        }),
        allowGlobalContext: true,
    });
}
