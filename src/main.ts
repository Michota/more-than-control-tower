import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import "tsconfig-paths/register"; // <-- Must be first import to work with tsconfig paths
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { DomainExceptionFilter } from "./libs/exceptions/domain-exception.filter";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new DomainExceptionFilter());

    const config = new DocumentBuilder()
        .setVersion("1.0")
        .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
        .addSecurityRequirements("access-token")
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, documentFactory);

    await app.listen(env.SERVER_PORT);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
