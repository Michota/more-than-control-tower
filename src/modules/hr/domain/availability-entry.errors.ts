import { BadRequestDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

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
