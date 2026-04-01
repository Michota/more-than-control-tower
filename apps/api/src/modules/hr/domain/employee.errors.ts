import {
    BadRequestDomainException,
    ConflictDomainException,
    NotFoundDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class EmployeeNotFoundError extends NotFoundDomainException {
    static readonly message = "error_employee_not_found";
    public readonly code = "EMPLOYEE.NOT_FOUND";

    constructor(employeeId: string) {
        super(EmployeeNotFoundError.message, undefined, { employeeId });
    }
}

export class EmployeeAlreadyExistsError extends ConflictDomainException {
    static readonly message = "error_employee_already_exists";
    public readonly code = "EMPLOYEE.ALREADY_EXISTS";

    constructor(identifier: string) {
        super(EmployeeAlreadyExistsError.message, undefined, { identifier });
    }
}

export class EmployeeDuplicateEmailError extends ConflictDomainException {
    static readonly message = "error_employee_duplicate_email";
    public readonly code = "EMPLOYEE.DUPLICATE_EMAIL";

    constructor(email: string) {
        super(EmployeeDuplicateEmailError.message, undefined, { email });
    }
}

export class EmployeeDuplicatePhoneError extends ConflictDomainException {
    static readonly message = "error_employee_duplicate_phone";
    public readonly code = "EMPLOYEE.DUPLICATE_PHONE";

    constructor(phone: string) {
        super(EmployeeDuplicatePhoneError.message, undefined, { phone });
    }
}

export class PositionAlreadyAssignedError extends ConflictDomainException {
    static readonly message = "error_employee_position_already_assigned";
    public readonly code = "EMPLOYEE.POSITION_ALREADY_ASSIGNED";

    constructor(positionKey: string) {
        super(PositionAlreadyAssignedError.message, undefined, { positionKey });
    }
}

export class PositionNotAssignedError extends BadRequestDomainException {
    static readonly message = "error_employee_position_not_assigned";
    public readonly code = "EMPLOYEE.POSITION_NOT_ASSIGNED";

    constructor(positionKey: string) {
        super(PositionNotAssignedError.message, undefined, { positionKey });
    }
}

export class EmployeeAlreadyLinkedError extends ConflictDomainException {
    static readonly message = "error_employee_already_linked_to_user";
    public readonly code = "EMPLOYEE.ALREADY_LINKED_TO_USER";

    constructor(userId: string) {
        super(EmployeeAlreadyLinkedError.message, undefined, { userId });
    }
}

export class UserNotFoundError extends BadRequestDomainException {
    static readonly message = "error_employee_user_not_found";
    public readonly code = "EMPLOYEE.USER_NOT_FOUND";

    constructor(userId: string) {
        super(UserNotFoundError.message, undefined, { userId });
    }
}

export class InvalidPositionKeyError extends BadRequestDomainException {
    static readonly message = "error_employee_invalid_position_key";
    public readonly code = "EMPLOYEE.INVALID_POSITION_KEY";

    constructor(positionKey: string) {
        super(InvalidPositionKeyError.message, undefined, { positionKey });
    }
}

export class PositionNotFoundError extends NotFoundDomainException {
    static readonly message = "error_position_not_found";
    public readonly code = "POSITION.NOT_FOUND";

    constructor(positionId: string) {
        super(PositionNotFoundError.message, undefined, { positionId });
    }
}

export class PositionKeyAlreadyExistsError extends ConflictDomainException {
    static readonly message = "error_position_key_already_exists";
    public readonly code = "POSITION.KEY_ALREADY_EXISTS";

    constructor(key: string) {
        super(PositionKeyAlreadyExistsError.message, undefined, { key });
    }
}

export class UnknownPermissionError extends BadRequestDomainException {
    static readonly message = "error_employee_unknown_permission";
    public readonly code = "EMPLOYEE.UNKNOWN_PERMISSION";

    constructor(permissionKey: string) {
        super(UnknownPermissionError.message, undefined, { permissionKey });
    }
}

export class EmployeeInactiveError extends BadRequestDomainException {
    static readonly message = "error_employee_inactive";
    public readonly code = "EMPLOYEE.INACTIVE";

    constructor(employeeId: string) {
        super(EmployeeInactiveError.message, undefined, { employeeId });
    }
}
