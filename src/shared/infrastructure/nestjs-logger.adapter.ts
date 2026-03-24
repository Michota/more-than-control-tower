import { Injectable, Logger } from "@nestjs/common";
import type { LoggerPort } from "../../libs/ports/logger.port.js";

@Injectable()
export class NestJsLoggerAdapter implements LoggerPort {
    private readonly logger = new Logger();

    log(message: string, ...meta: unknown[]): void {
        this.logger.log(message, ...meta);
    }

    error(message: string, trace?: unknown, ...meta: unknown[]): void {
        this.logger.error(message, trace, ...meta);
    }

    warn(message: string, ...meta: unknown[]): void {
        this.logger.warn(message, ...meta);
    }

    debug(message: string, ...meta: unknown[]): void {
        this.logger.debug(message, ...meta);
    }
}
