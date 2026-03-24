import { HttpStatus } from "@nestjs/common";
import { Exception } from "./exception.abstract";
import { ExceptionCode } from "./exception.codes";

export class ArgumentInvalidException extends Exception {
    readonly code = ExceptionCode.ARGUMENT_INVALID;
    readonly httpStatusCode = HttpStatus.BAD_REQUEST;
}

export class ArgumentNotProvidedException extends Exception {
    readonly code = ExceptionCode.ARGUMENT_NOT_PROVIDED;
    readonly httpStatusCode = HttpStatus.BAD_REQUEST;
}

export class ConflictException extends Exception {
    readonly code = ExceptionCode.CONFLICT;
    readonly httpStatusCode = HttpStatus.CONFLICT;
}

export class NotFoundException extends Exception {
    static readonly message = "Not found";

    constructor(message = NotFoundException.message) {
        super(message);
    }

    readonly code = ExceptionCode.NOT_FOUND;
    readonly httpStatusCode = HttpStatus.NOT_FOUND;
}

export class InternalServerErrorException extends Exception {
    static readonly message = "Internal server error";

    constructor(message = InternalServerErrorException.message) {
        super(message);
    }

    readonly code = ExceptionCode.INTERNAL_SERVER_ERROR;
    readonly httpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR;
}
