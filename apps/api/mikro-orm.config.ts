import { env } from "./src/config/env.js";
import { generateMikroOrmOptions } from "./src/config/generate-mikro-orm.config.js";
import { MikroOrmModuleSyncOptions } from "@mikro-orm/nestjs";

export default {
    ...generateMikroOrmOptions({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        dbName: env.DB_NAME,
    }),
    entitiesTs: ["src/**/*.entity.ts", "src/**/*.embeddable.ts"],
    entities: ["dist/**/*.entity.js", "dist/**/*.embeddable.js"],
} satisfies MikroOrmModuleSyncOptions;
