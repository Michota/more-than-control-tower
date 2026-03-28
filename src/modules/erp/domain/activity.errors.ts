import { NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class ActivityNotFoundError extends NotFoundDomainException {
    static readonly message = "Activity not found.";
    public readonly code = "ERP.ACTIVITY.NOT_FOUND";

    constructor(id: string) {
        super(ActivityNotFoundError.message, undefined, { id });
    }
}
