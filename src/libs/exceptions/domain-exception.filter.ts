import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import { Exception } from "./exception.abstract.js";

@Catch(Exception)
export class DomainExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(DomainExceptionFilter.name);

    catch(exception: Exception, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const status = this.resolveStatus(exception);

        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`Unhandled domain exception: ${exception.code} — ${exception.message}`, exception.stack);
        }

        response.status(status).json({
            statusCode: status,
            code: exception.code,
            message: exception.message,
        });
    }

    private resolveStatus(exception: Exception): HttpStatus {
        if ("httpStatusCode" in exception && typeof exception.httpStatusCode === "number") {
            return exception.httpStatusCode;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
