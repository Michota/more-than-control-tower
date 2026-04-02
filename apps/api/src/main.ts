import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";
import { NodeEnv } from "@mtct/shared-types";
import cookieParser from "cookie-parser";

import { AppModule } from "./app.module.js";
import { env } from "./config/env.js";
import { DomainExceptionFilter } from "./libs/exceptions/domain-exception.filter.js";
import { createDocumentFactory } from "./swagger/index.js";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());
    app.enableCors({
        origin: env.CORS_ORIGIN?.split(",") ?? [],
        credentials: true,
    });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new DomainExceptionFilter());

    if (env.NODE_ENV !== NodeEnv.Production) {
        SwaggerModule.setup("api", app, createDocumentFactory(app), {
            swaggerOptions: { persistAuthorization: true },
        });
    }

    await app.listen(env.SERVER_PORT);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
