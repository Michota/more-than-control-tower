import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

// ─── Not Found ───────────────────────────────────────────

export class RouteNotFoundError extends NotFoundDomainException {
    public readonly code = "ROUTE.NOT_FOUND";

    constructor(id: string) {
        super(`Route with id ${id} not found`);
    }
}

// ─── Conflict ────────────────────────────────────────────

export class RouteAlreadyArchivedError extends ConflictDomainException {
    public readonly code = "ROUTE.ALREADY_ARCHIVED";

    constructor(id: string) {
        super(`Route ${id} is already archived`);
    }
}

export class RouteArchivedCannotBeModifiedError extends ConflictDomainException {
    public readonly code = "ROUTE.ARCHIVED_CANNOT_MODIFY";

    constructor(id: string) {
        super(`Route ${id} is archived and cannot be modified`);
    }
}

export class RouteAlreadyActiveError extends ConflictDomainException {
    public readonly code = "ROUTE.ALREADY_ACTIVE";

    constructor(id: string) {
        super(`Route ${id} is already active`);
    }
}

export class RouteAlreadyInactiveError extends ConflictDomainException {
    public readonly code = "ROUTE.ALREADY_INACTIVE";

    constructor(id: string) {
        super(`Route ${id} is already inactive`);
    }
}
