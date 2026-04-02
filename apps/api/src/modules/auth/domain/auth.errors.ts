import {
    UnauthorizedDomainException,
    ForbiddenDomainException,
    ConflictDomainException,
    BadRequestDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class InvalidCredentialsError extends UnauthorizedDomainException {
    static readonly message = "error_auth_invalid_credentials";
    readonly code = "AUTH.INVALID_CREDENTIALS";

    constructor() {
        super(InvalidCredentialsError.message);
    }
}

export class AccountNotActivatedError extends ForbiddenDomainException {
    static readonly message = "error_auth_account_not_activated";
    readonly code = "AUTH.ACCOUNT_NOT_ACTIVATED";

    constructor() {
        super(AccountNotActivatedError.message);
    }
}

export class AccountAlreadyActivatedError extends ConflictDomainException {
    static readonly message = "error_auth_account_already_activated";
    readonly code = "AUTH.ACCOUNT_ALREADY_ACTIVATED";

    constructor() {
        super(AccountAlreadyActivatedError.message);
    }
}

export class AccountSuspendedError extends ForbiddenDomainException {
    static readonly message = "error_auth_account_suspended";
    readonly code = "AUTH.ACCOUNT_SUSPENDED";

    constructor() {
        super(AccountSuspendedError.message);
    }
}

export class InvalidActivationTokenError extends BadRequestDomainException {
    static readonly message = "error_auth_invalid_activation_token";
    readonly code = "AUTH.INVALID_ACTIVATION_TOKEN";

    constructor() {
        super(InvalidActivationTokenError.message);
    }
}
