import {
    UnauthorizedDomainException,
    ForbiddenDomainException,
    ConflictDomainException,
    BadRequestDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class InvalidCredentialsError extends UnauthorizedDomainException {
    readonly code = "AUTH.INVALID_CREDENTIALS";

    constructor() {
        super("Invalid email or password");
    }
}

export class AccountNotActivatedError extends ForbiddenDomainException {
    readonly code = "AUTH.ACCOUNT_NOT_ACTIVATED";

    constructor() {
        super("Account has not been activated yet");
    }
}

export class AccountAlreadyActivatedError extends ConflictDomainException {
    readonly code = "AUTH.ACCOUNT_ALREADY_ACTIVATED";

    constructor() {
        super("Account has already been activated");
    }
}

export class AccountSuspendedError extends ForbiddenDomainException {
    readonly code = "AUTH.ACCOUNT_SUSPENDED";

    constructor() {
        super("Account is suspended");
    }
}

export class InvalidActivationTokenError extends BadRequestDomainException {
    readonly code = "AUTH.INVALID_ACTIVATION_TOKEN";

    constructor() {
        super("Activation token is invalid or expired");
    }
}
