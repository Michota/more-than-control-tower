import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class WorkingHoursEntryNotFoundError extends NotFoundDomainException {
    static readonly message = "Working hours entry not found.";
    public readonly code = "ERP.WORKING_HOURS.NOT_FOUND";

    constructor(id: string) {
        super(WorkingHoursEntryNotFoundError.message, undefined, { id });
    }
}

export class WorkingHoursEntryLockedError extends ConflictDomainException {
    static readonly message = "Cannot modify locked working hours entry.";
    public readonly code = "ERP.WORKING_HOURS.LOCKED";

    constructor(id: string) {
        super(WorkingHoursEntryLockedError.message, undefined, { id });
    }
}

export class WorkingHoursEntryAlreadyLockedError extends ConflictDomainException {
    static readonly message = "Working hours entry is already locked.";
    public readonly code = "ERP.WORKING_HOURS.ALREADY_LOCKED";

    constructor(id: string) {
        super(WorkingHoursEntryAlreadyLockedError.message, undefined, { id });
    }
}
