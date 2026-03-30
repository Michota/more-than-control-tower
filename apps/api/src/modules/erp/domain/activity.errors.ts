import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class ActivityNotFoundError extends NotFoundDomainException {
    static readonly message = "Activity not found.";
    public readonly code = "ERP.ACTIVITY.NOT_FOUND";

    constructor(id: string) {
        super(ActivityNotFoundError.message, undefined, { id });
    }
}

export class ActivityInUseError extends ConflictDomainException {
    static readonly message = "Cannot delete activity that is assigned to working hours entries.";
    public readonly code = "ERP.ACTIVITY.IN_USE";

    constructor(id: string) {
        super(ActivityInUseError.message, undefined, { id });
    }
}
