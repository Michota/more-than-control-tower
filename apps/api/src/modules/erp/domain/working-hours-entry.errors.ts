import {
    ConflictDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class WorkingHoursEntryNotFoundError extends NotFoundDomainException {
    static readonly message = "error_erp_working_hours_not_found";
    public readonly code = "ERP.WORKING_HOURS.NOT_FOUND";

    constructor(id: string) {
        super(WorkingHoursEntryNotFoundError.message, undefined, { id });
    }
}

export class WorkingHoursEntryLockedError extends ConflictDomainException {
    static readonly message = "error_erp_working_hours_locked";
    public readonly code = "ERP.WORKING_HOURS.LOCKED";

    constructor(id: string) {
        super(WorkingHoursEntryLockedError.message, undefined, { id });
    }
}

export class WorkingHoursEntryAlreadyLockedError extends ConflictDomainException {
    static readonly message = "error_erp_working_hours_already_locked";
    public readonly code = "ERP.WORKING_HOURS.ALREADY_LOCKED";

    constructor(id: string) {
        super(WorkingHoursEntryAlreadyLockedError.message, undefined, { id });
    }
}

export class WorkingHoursNotOwnedError extends ForbiddenDomainException {
    static readonly message = "error_erp_working_hours_not_owned";
    public readonly code = "ERP.WORKING_HOURS.NOT_OWNED";

    constructor(employeeId: string) {
        super(WorkingHoursNotOwnedError.message, undefined, { employeeId });
    }
}
