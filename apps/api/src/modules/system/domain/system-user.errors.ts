import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class SystemUserNotFoundError extends NotFoundDomainException {
    readonly code = "SYSTEM_USER.NOT_FOUND";

    constructor(userId: string) {
        super(`System user ${userId} not found`);
    }
}

export class CannotRemoveOwnAdminRoleError extends ConflictDomainException {
    readonly code = "SYSTEM_USER.CANNOT_REMOVE_OWN_ADMIN_ROLE";

    constructor() {
        super("Administrator cannot remove the administrator role from themselves");
    }
}

export class SystemUserDuplicateEmailError extends ConflictDomainException {
    readonly code = "SYSTEM_USER.DUPLICATE_EMAIL";

    constructor(email: string) {
        super(`System user with email ${email} already exists`);
    }
}

export class LastActiveAdminError extends ConflictDomainException {
    readonly code = "SYSTEM_USER.LAST_ACTIVE_ADMIN";

    constructor() {
        super("Cannot remove the last active administrator from the system");
    }
}
