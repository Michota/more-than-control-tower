import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import { ZodError } from "zod";
import { Exception } from "./exception.abstract.js";

@Catch(Exception, ZodError)
export class DomainExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(DomainExceptionFilter.name);

    catch(exception: Exception | ZodError, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception instanceof ZodError) {
            response.status(HttpStatus.BAD_REQUEST).json({
                statusCode: HttpStatus.BAD_REQUEST,
                code: "VALIDATION_ERROR",
                message: "error_validation_failed",
                errors: exception.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message,
                })),
            });
            return;
        }

        const status = this.resolveStatus(exception);

        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`Unhandled domain exception: ${exception.code} — ${exception.message}`, exception.stack);
        }

        // metadata is intentionally excluded — it may contain internal IDs,
        // quantities, or other data that should not leak outside the backend.
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
