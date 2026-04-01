import {
    BadRequestDomainException,
    ConflictDomainException,
    ForbiddenDomainException,
    NotFoundDomainException,
} from "../../../libs/exceptions/http-domain.exceptions.js";

export class WalletNotFoundError extends NotFoundDomainException {
    static readonly message = "error_erp_wallet_not_found";
    public readonly code = "ERP.WALLET.NOT_FOUND";

    constructor(employeeId: string) {
        super(WalletNotFoundError.message, undefined, { employeeId });
    }
}

export class WalletAlreadyExistsError extends ConflictDomainException {
    static readonly message = "error_erp_wallet_already_exists";
    public readonly code = "ERP.WALLET.ALREADY_EXISTS";

    constructor(employeeId: string) {
        super(WalletAlreadyExistsError.message, undefined, { employeeId });
    }
}

export class InsufficientWalletBalanceError extends BadRequestDomainException {
    static readonly message = "error_erp_wallet_insufficient_balance";
    public readonly code = "ERP.WALLET.INSUFFICIENT_BALANCE";

    constructor(walletId: string) {
        super(InsufficientWalletBalanceError.message, undefined, { walletId });
    }
}

export class WalletNotOwnedError extends ForbiddenDomainException {
    static readonly message = "error_erp_wallet_not_owned";
    public readonly code = "ERP.WALLET.NOT_OWNED";

    constructor(employeeId: string) {
        super(WalletNotOwnedError.message, undefined, { employeeId });
    }
}
