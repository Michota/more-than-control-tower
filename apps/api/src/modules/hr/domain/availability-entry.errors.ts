import {
    BadRequestDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class AvailabilityEntryNotFoundError extends NotFoundDomainException {
    static readonly message = "error_availability_not_found";
    public readonly code = "AVAILABILITY.NOT_FOUND";

    constructor(entryId: string) {
        super(AvailabilityEntryNotFoundError.message, undefined, { entryId });
    }
}

export class AvailabilityAlreadyConfirmedError extends BadRequestDomainException {
    static readonly message = "error_availability_already_confirmed";
    public readonly code = "AVAILABILITY.ALREADY_CONFIRMED";

    constructor(entryId: string) {
        super(AvailabilityAlreadyConfirmedError.message, undefined, { entryId });
    }
}

export class NoPendingAvailabilityError extends BadRequestDomainException {
    static readonly message = "error_availability_not_pending";
    public readonly code = "AVAILABILITY.NOT_PENDING";

    constructor(entryId: string) {
        super(NoPendingAvailabilityError.message, undefined, { entryId });
    }
}

export class AvailabilityAlreadyLockedError extends BadRequestDomainException {
    static readonly message = "error_availability_already_locked";
    public readonly code = "AVAILABILITY.ALREADY_LOCKED";

    constructor(entryId: string) {
        super(AvailabilityAlreadyLockedError.message, undefined, { entryId });
    }
}

export class AvailabilityNotOwnedError extends ForbiddenDomainException {
    static readonly message = "error_availability_not_owned";
    public readonly code = "AVAILABILITY.NOT_OWNED";

    constructor(employeeId: string) {
        super(AvailabilityNotOwnedError.message, undefined, { employeeId });
    }
}

export class AvailabilityLockedError extends BadRequestDomainException {
    static readonly message = "error_availability_locked";
    public readonly code = "AVAILABILITY.LOCKED";

    constructor(dates: string[]) {
        super(AvailabilityLockedError.message, undefined, { dates });
    }
}

export class AvailabilityDatePassedError extends BadRequestDomainException {
    static readonly message = "error_availability_date_passed";
    public readonly code = "AVAILABILITY.DATE_PASSED";

    constructor(dates: string[]) {
        super(AvailabilityDatePassedError.message, undefined, { dates });
    }
}
