import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerDocumentOptions, SwaggerModule } from "@nestjs/swagger";

const config = new DocumentBuilder()
    .setTitle("DSC Distribution Management API")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
    .addSecurityRequirements("access-token")
    .build();

const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
        const cleanController = controllerKey.replace(/(?:Http)?Controller$/, "");
        return `${methodKey}${cleanController}`;
    },
};

export const createDocumentFactory =
    (app: INestApplication, documentModifiers?: ((document: OpenAPIObject) => OpenAPIObject)[]) => () => {
        const document = SwaggerModule.createDocument(app, config, options);
        if (documentModifiers) {
            return documentModifiers.reduce((prev, curr) => curr(prev), document);
        }
        return document;
    };
