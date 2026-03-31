import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";

import "tsconfig-paths/register"; // <-- Must be first import to work with tsconfig paths
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { DomainExceptionFilter } from "./libs/exceptions/domain-exception.filter";
import { createDocumentFactory } from "./swagger/document-factory.config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: env.CORS_ORIGIN?.split(",") ?? [],
        credentials: true,
    });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new DomainExceptionFilter());

    SwaggerModule.setup("api", app, createDocumentFactory(app), {
        swaggerOptions: { persistAuthorization: true },
    });

    await app.listen(env.SERVER_PORT);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
