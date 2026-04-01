import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class CodeNotFoundError extends NotFoundDomainException {
    static readonly message = "error_code_not_found";
    public readonly code = "CODE.NOT_FOUND";

    constructor(id: string) {
        super(CodeNotFoundError.message, undefined, { id });
    }
}

export class CodeValueAlreadyExistsError extends ConflictDomainException {
    static readonly message = "error_code_value_already_exists";
    public readonly code = "CODE.VALUE_ALREADY_EXISTS";

    constructor(value: string) {
        super(CodeValueAlreadyExistsError.message, undefined, { value });
    }
}
