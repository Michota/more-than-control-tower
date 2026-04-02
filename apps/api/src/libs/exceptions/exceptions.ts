import { ExceptionCode } from "./exception.codes";
import {
    BadRequestDomainException,
    ConflictDomainException,
    InternalDomainException,
    NotFoundDomainException,
} from "./http-domain.exceptions";

export class ArgumentInvalidException extends BadRequestDomainException {
    readonly code = ExceptionCode.ARGUMENT_INVALID;
}

export class ArgumentNotProvidedException extends BadRequestDomainException {
    readonly code = ExceptionCode.ARGUMENT_NOT_PROVIDED;
}

export class ConflictException extends ConflictDomainException {
    readonly code = ExceptionCode.CONFLICT;
}

export class NotFoundException extends NotFoundDomainException {
    static readonly message = "error_not_found";

    constructor(message = NotFoundException.message) {
        super(message);
    }

    readonly code = ExceptionCode.NOT_FOUND;
}

export class InternalServerErrorException extends InternalDomainException {
    static readonly message = "error_internal_server_error";

    constructor(message = InternalServerErrorException.message) {
        super(message);
    }

    readonly code = ExceptionCode.INTERNAL_SERVER_ERROR;
}
