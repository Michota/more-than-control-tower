import {
    BadRequestDomainException,
    ConflictDomainException,
    NotFoundDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class EmployeeNotFoundError extends NotFoundDomainException {
    public readonly code = "EMPLOYEE.NOT_FOUND";

    constructor(employeeId: string) {
        super(`Employee with id "${employeeId}" not found`);
    }
}

export class EmployeeAlreadyExistsError extends ConflictDomainException {
    public readonly code = "EMPLOYEE.ALREADY_EXISTS";

    constructor(identifier: string) {
        super(`Employee already exists: "${identifier}"`);
    }
}

export class EmployeeDuplicateEmailError extends ConflictDomainException {
    public readonly code = "EMPLOYEE.DUPLICATE_EMAIL";

    constructor(email: string) {
        super(`An active employee with email "${email}" already exists`);
    }
}

export class EmployeeDuplicatePhoneError extends ConflictDomainException {
    public readonly code = "EMPLOYEE.DUPLICATE_PHONE";

    constructor(phone: string) {
        super(`An active employee with phone "${phone}" already exists`);
    }
}

export class PositionAlreadyAssignedError extends ConflictDomainException {
    public readonly code = "EMPLOYEE.POSITION_ALREADY_ASSIGNED";

    constructor(positionKey: string) {
        super(`Position "${positionKey}" is already assigned to this employee`);
    }
}

export class PositionNotAssignedError extends BadRequestDomainException {
    public readonly code = "EMPLOYEE.POSITION_NOT_ASSIGNED";

    constructor(positionKey: string) {
        super(`Position "${positionKey}" is not assigned to this employee`);
    }
}

export class EmployeeAlreadyLinkedError extends ConflictDomainException {
    public readonly code = "EMPLOYEE.ALREADY_LINKED_TO_USER";

    constructor(userId: string) {
        super(`Employee is already linked to user "${userId}"`);
    }
}

export class UserNotFoundError extends BadRequestDomainException {
    public readonly code = "EMPLOYEE.USER_NOT_FOUND";

    constructor(userId: string) {
        super(`System user "${userId}" does not exist`);
    }
}

export class InvalidPositionKeyError extends BadRequestDomainException {
    public readonly code = "EMPLOYEE.INVALID_POSITION_KEY";

    constructor(positionKey: string) {
        super(`Position "${positionKey}" does not exist`);
    }
}

export class PositionNotFoundError extends NotFoundDomainException {
    public readonly code = "POSITION.NOT_FOUND";

    constructor(positionId: string) {
        super(`Position with id "${positionId}" not found`);
    }
}

export class PositionKeyAlreadyExistsError extends ConflictDomainException {
    public readonly code = "POSITION.KEY_ALREADY_EXISTS";

    constructor(key: string) {
        super(`Position with key "${key}" already exists`);
    }
}

export class InvalidQualificationError extends BadRequestDomainException {
    public readonly code = "EMPLOYEE.INVALID_QUALIFICATION";

    constructor(message: string) {
        super(message);
    }
}

export class UnknownPermissionError extends BadRequestDomainException {
    public readonly code = "EMPLOYEE.UNKNOWN_PERMISSION";

    constructor(permissionKey: string) {
        super(`Permission "${permissionKey}" does not exist in the system`);
    }
}

export class EmployeeInactiveError extends BadRequestDomainException {
    public readonly code = "EMPLOYEE.INACTIVE";

    constructor(employeeId: string) {
        super(`Employee "${employeeId}" is inactive`);
    }
}
