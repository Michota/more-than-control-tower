import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

// ─── Not Found ───────────────────────────────────────────

export class JourneyNotFoundError extends NotFoundDomainException {
    static readonly message = "error_journey_not_found";
    public readonly code = "JOURNEY.NOT_FOUND";

    constructor(id: string) {
        super(JourneyNotFoundError.message, undefined, { id });
    }
}

// ─── Conflict ────────────────────────────────────────────

export class JourneyAlreadyCompletedError extends ConflictDomainException {
    static readonly message = "error_journey_already_completed";
    public readonly code = "JOURNEY.ALREADY_COMPLETED";

    constructor(id: string) {
        super(JourneyAlreadyCompletedError.message, undefined, { id });
    }
}

export class JourneyAlreadyCancelledError extends ConflictDomainException {
    static readonly message = "error_journey_already_cancelled";
    public readonly code = "JOURNEY.ALREADY_CANCELLED";

    constructor(id: string) {
        super(JourneyAlreadyCancelledError.message, undefined, { id });
    }
}

export class JourneyCannotStartError extends ConflictDomainException {
    static readonly message = "error_journey_cannot_start";
    public readonly code = "JOURNEY.CANNOT_START";

    constructor(id: string) {
        super(JourneyCannotStartError.message, undefined, { id });
    }
}

export class JourneyNotInProgressError extends ConflictDomainException {
    static readonly message = "error_journey_not_in_progress";
    public readonly code = "JOURNEY.NOT_IN_PROGRESS";

    constructor(id: string) {
        super(JourneyNotInProgressError.message, undefined, { id });
    }
}

export class JourneyNotModifiableError extends ConflictDomainException {
    static readonly message = "error_journey_not_modifiable";
    public readonly code = "JOURNEY.NOT_MODIFIABLE";

    constructor(id: string) {
        super(JourneyNotModifiableError.message, undefined, { id });
    }
}

export class JourneyNotPlannedError extends ConflictDomainException {
    static readonly message = "error_journey_not_planned";
    public readonly code = "JOURNEY.NOT_PLANNED";

    constructor(id: string) {
        super(JourneyNotPlannedError.message, undefined, { id });
    }
}

export class JourneyNotAwaitingLoadingError extends ConflictDomainException {
    static readonly message = "error_journey_not_awaiting_loading";
    public readonly code = "JOURNEY.NOT_AWAITING_LOADING";

    constructor(id: string) {
        super(JourneyNotAwaitingLoadingError.message, undefined, { id });
    }
}

export class JourneyNotAwaitingDepartureError extends ConflictDomainException {
    static readonly message = "error_journey_not_awaiting_departure";
    public readonly code = "JOURNEY.NOT_AWAITING_DEPARTURE";

    constructor(id: string) {
        super(JourneyNotAwaitingDepartureError.message, undefined, { id });
    }
}

export class JourneyStopNotFoundError extends NotFoundDomainException {
    static readonly message = "error_journey_stop_not_found";
    public readonly code = "JOURNEY.STOP_NOT_FOUND";

    constructor(journeyId: string, customerId: string) {
        super(JourneyStopNotFoundError.message, undefined, { journeyId, customerId });
    }
}

export class JourneyStopAlreadyExistsError extends ConflictDomainException {
    static readonly message = "error_journey_stop_already_exists";
    public readonly code = "JOURNEY.STOP_ALREADY_EXISTS";

    constructor(journeyId: string, customerId: string) {
        super(JourneyStopAlreadyExistsError.message, undefined, { journeyId, customerId });
    }
}

export class OrderAlreadyAssignedToStopError extends ConflictDomainException {
    static readonly message = "error_journey_order_already_assigned";
    public readonly code = "JOURNEY.ORDER_ALREADY_ASSIGNED";

    constructor(orderId: string, customerId: string) {
        super(OrderAlreadyAssignedToStopError.message, undefined, { orderId, customerId });
    }
}

export class OrderNotAssignedToStopError extends NotFoundDomainException {
    static readonly message = "error_journey_order_not_assigned";
    public readonly code = "JOURNEY.ORDER_NOT_ASSIGNED";

    constructor(orderId: string, customerId: string) {
        super(OrderNotAssignedToStopError.message, undefined, { orderId, customerId });
    }
}

export class JourneyMissingDriverError extends ConflictDomainException {
    static readonly message = "error_journey_missing_driver";
    public readonly code = "JOURNEY.MISSING_DRIVER";

    constructor(id: string) {
        super(JourneyMissingDriverError.message, undefined, { id });
    }
}

export class JourneyMissingRsrError extends ConflictDomainException {
    static readonly message = "error_journey_missing_rsr";
    public readonly code = "JOURNEY.MISSING_RSR";

    constructor(id: string) {
        super(JourneyMissingRsrError.message, undefined, { id });
    }
}

export class CrewMemberMissingPermissionError extends ConflictDomainException {
    static readonly message = "error_journey_crew_missing_permission";
    public readonly code = "JOURNEY.CREW_MISSING_PERMISSION";

    constructor(employeeId: string, role: string, missingPermission: string) {
        super(CrewMemberMissingPermissionError.message, undefined, { employeeId, role, missingPermission });
    }
}
