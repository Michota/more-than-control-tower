import { HttpStatus } from "@nestjs/common";
import { Exception } from "./exception.abstract.js";

export abstract class NotFoundDomainException extends Exception {
    readonly httpStatusCode = HttpStatus.NOT_FOUND;
}

export abstract class ConflictDomainException extends Exception {
    readonly httpStatusCode = HttpStatus.CONFLICT;
}

export abstract class BadRequestDomainException extends Exception {
    readonly httpStatusCode = HttpStatus.BAD_REQUEST;
}

export abstract class ForbiddenDomainException extends Exception {
    readonly httpStatusCode = HttpStatus.FORBIDDEN;
}

export abstract class UnauthorizedDomainException extends Exception {
    readonly httpStatusCode = HttpStatus.UNAUTHORIZED;
}

export abstract class InternalDomainException extends Exception {
    readonly httpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR;
}
