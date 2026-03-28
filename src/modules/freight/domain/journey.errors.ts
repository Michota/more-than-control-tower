import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

// ─── Not Found ───────────────────────────────────────────

export class JourneyNotFoundError extends NotFoundDomainException {
    public readonly code = "JOURNEY.NOT_FOUND";

    constructor(id: string) {
        super(`Journey with id ${id} not found`);
    }
}

// ─── Conflict ────────────────────────────────────────────

export class JourneyAlreadyCompletedError extends ConflictDomainException {
    public readonly code = "JOURNEY.ALREADY_COMPLETED";

    constructor(id: string) {
        super(`Journey ${id} is already completed`);
    }
}

export class JourneyAlreadyCancelledError extends ConflictDomainException {
    public readonly code = "JOURNEY.ALREADY_CANCELLED";

    constructor(id: string) {
        super(`Journey ${id} is already cancelled`);
    }
}

export class JourneyCannotStartError extends ConflictDomainException {
    public readonly code = "JOURNEY.CANNOT_START";

    constructor(id: string) {
        super(`Journey ${id} cannot be started from its current status`);
    }
}

export class JourneyNotInProgressError extends ConflictDomainException {
    public readonly code = "JOURNEY.NOT_IN_PROGRESS";

    constructor(id: string) {
        super(`Journey ${id} is not in progress`);
    }
}
