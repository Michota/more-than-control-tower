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

export class EmployeeInactiveError extends BadRequestDomainException {
    public readonly code = "EMPLOYEE.INACTIVE";

    constructor(employeeId: string) {
        super(`Employee "${employeeId}" is inactive`);
    }
}
