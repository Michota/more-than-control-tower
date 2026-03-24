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
