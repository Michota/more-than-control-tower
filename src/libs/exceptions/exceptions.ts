import { Exception } from "./exception.abstract";
import { ExceptionCode } from "./exception.codes";

/**
 * Used to indicate that an incorrect argument was provided to a method/function/class constructor
 *
 * @class ArgumentInvalidException
 * @extends {Exception}
 */
export class ArgumentInvalidException extends Exception {
    readonly code = ExceptionCode.ARGUMENT_INVALID;
}

/**
 * Used to indicate that an argument was not provided (is empty object/array, null of undefined).
 *
 * @class ArgumentNotProvidedException
 * @extends {Exception}
 */
export class ArgumentNotProvidedException extends Exception {
    readonly code = ExceptionCode.ARGUMENT_NOT_PROVIDED;
}

/**
 * Used to indicate conflicting entities (usually in the database)
 *
 * @class ConflictException
 * @extends {Exception}
 */
export class ConflictException extends Exception {
    readonly code = ExceptionCode.CONFLICT;
}

/**
 * Used to indicate that entity is not found
 *
 * @class NotFoundException
 * @extends {Exception}
 */
export class NotFoundException extends Exception {
    static readonly message = "Not found";

    constructor(message = NotFoundException.message) {
        super(message);
    }

    readonly code = ExceptionCode.NOT_FOUND;
}

/**
 * Used to indicate an internal server error that does not fall under all other errors
 *
 * @class InternalServerErrorException
 * @extends {Exception}
 */
export class InternalServerErrorException extends Exception {
    static readonly message = "Internal server error";

    constructor(message = InternalServerErrorException.message) {
        super(message);
    }

    readonly code = ExceptionCode.INTERNAL_SERVER_ERROR;
}
