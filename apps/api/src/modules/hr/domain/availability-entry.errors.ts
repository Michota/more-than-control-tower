import {
    BadRequestDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class AvailabilityEntryNotFoundError extends NotFoundDomainException {
    public readonly code = "AVAILABILITY.NOT_FOUND";

    constructor(entryId: string) {
        super(`Availability entry "${entryId}" not found`);
    }
}

export class AvailabilityAlreadyConfirmedError extends BadRequestDomainException {
    public readonly code = "AVAILABILITY.ALREADY_CONFIRMED";

    constructor(entryId: string) {
        super(`Availability entry "${entryId}" is already confirmed`);
    }
}

export class NoPendingAvailabilityError extends BadRequestDomainException {
    public readonly code = "AVAILABILITY.NOT_PENDING";

    constructor(entryId: string) {
        super(`Availability entry "${entryId}" is not pending approval`);
    }
}

export class AvailabilityAlreadyLockedError extends BadRequestDomainException {
    public readonly code = "AVAILABILITY.ALREADY_LOCKED";

    constructor(entryId: string) {
        super(`Availability entry "${entryId}" is already locked`);
    }
}

export class AvailabilityNotOwnedError extends ForbiddenDomainException {
    public readonly code = "AVAILABILITY.NOT_OWNED";

    constructor(employeeId: string) {
        super(`You can only manage your own availability, not employee "${employeeId}"`);
    }
}

export class AvailabilityLockedError extends BadRequestDomainException {
    public readonly code = "AVAILABILITY.LOCKED";

    constructor(dates: string[]) {
        super(`Availability for dates [${dates.join(", ")}] is locked because the time has already started`);
    }
}

export class AvailabilityDatePassedError extends BadRequestDomainException {
    public readonly code = "AVAILABILITY.DATE_PASSED";

    constructor(dates: string[]) {
        super(`Cannot modify availability for past dates: [${dates.join(", ")}]`);
    }
}
