import { registerAs } from "@nestjs/config";
import { env } from "./env.js";

export default registerAs("database", () => ({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    dbName: env.DB_NAME,
}));
