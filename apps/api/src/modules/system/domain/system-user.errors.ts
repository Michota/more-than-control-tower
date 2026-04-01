import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class SystemUserNotFoundError extends NotFoundDomainException {
    static readonly message = "error_system_user_not_found";
    readonly code = "SYSTEM_USER.NOT_FOUND";

    constructor(userId: string) {
        super(SystemUserNotFoundError.message, undefined, { userId });
    }
}

export class CannotRemoveOwnAdminRoleError extends ConflictDomainException {
    static readonly message = "error_system_user_cannot_remove_own_admin_role";
    readonly code = "SYSTEM_USER.CANNOT_REMOVE_OWN_ADMIN_ROLE";

    constructor() {
        super(CannotRemoveOwnAdminRoleError.message);
    }
}

export class SystemUserDuplicateEmailError extends ConflictDomainException {
    static readonly message = "error_system_user_duplicate_email";
    readonly code = "SYSTEM_USER.DUPLICATE_EMAIL";

    constructor(email: string) {
        super(SystemUserDuplicateEmailError.message, undefined, { email });
    }
}

export class LastActiveAdminError extends ConflictDomainException {
    static readonly message = "error_system_user_last_active_admin";
    readonly code = "SYSTEM_USER.LAST_ACTIVE_ADMIN";

    constructor() {
        super(LastActiveAdminError.message);
    }
}
