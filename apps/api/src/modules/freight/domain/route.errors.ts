import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

// ─── Not Found ───────────────────────────────────────────

export class RouteNotFoundError extends NotFoundDomainException {
    static readonly message = "error_route_not_found";
    public readonly code = "ROUTE.NOT_FOUND";

    constructor(id: string) {
        super(RouteNotFoundError.message, undefined, { id });
    }
}

// ─── Conflict ────────────────────────────────────────────

export class RouteAlreadyArchivedError extends ConflictDomainException {
    static readonly message = "error_route_already_archived";
    public readonly code = "ROUTE.ALREADY_ARCHIVED";

    constructor(id: string) {
        super(RouteAlreadyArchivedError.message, undefined, { id });
    }
}

export class RouteArchivedCannotBeModifiedError extends ConflictDomainException {
    static readonly message = "error_route_archived_cannot_modify";
    public readonly code = "ROUTE.ARCHIVED_CANNOT_MODIFY";

    constructor(id: string) {
        super(RouteArchivedCannotBeModifiedError.message, undefined, { id });
    }
}

export class RouteAlreadyActiveError extends ConflictDomainException {
    static readonly message = "error_route_already_active";
    public readonly code = "ROUTE.ALREADY_ACTIVE";

    constructor(id: string) {
        super(RouteAlreadyActiveError.message, undefined, { id });
    }
}

export class RouteAlreadyInactiveError extends ConflictDomainException {
    static readonly message = "error_route_already_inactive";
    public readonly code = "ROUTE.ALREADY_INACTIVE";

    constructor(id: string) {
        super(RouteAlreadyInactiveError.message, undefined, { id });
    }
}
