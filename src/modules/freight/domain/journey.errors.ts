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

export class JourneyNotPlannedError extends ConflictDomainException {
    public readonly code = "JOURNEY.NOT_PLANNED";

    constructor(id: string) {
        super(`Journey ${id} can only be modified while in PLANNED status`);
    }
}

export class JourneyStopNotFoundError extends NotFoundDomainException {
    public readonly code = "JOURNEY.STOP_NOT_FOUND";

    constructor(journeyId: string, customerId: string) {
        super(`Stop for customer ${customerId} not found on journey ${journeyId}`);
    }
}

export class JourneyStopAlreadyExistsError extends ConflictDomainException {
    public readonly code = "JOURNEY.STOP_ALREADY_EXISTS";

    constructor(journeyId: string, customerId: string) {
        super(`Stop for customer ${customerId} already exists on journey ${journeyId}`);
    }
}

export class OrderAlreadyAssignedToStopError extends ConflictDomainException {
    public readonly code = "JOURNEY.ORDER_ALREADY_ASSIGNED";

    constructor(orderId: string, customerId: string) {
        super(`Order ${orderId} is already assigned to stop for customer ${customerId}`);
    }
}

export class OrderNotAssignedToStopError extends NotFoundDomainException {
    public readonly code = "JOURNEY.ORDER_NOT_ASSIGNED";

    constructor(orderId: string, customerId: string) {
        super(`Order ${orderId} is not assigned to stop for customer ${customerId}`);
    }
}
