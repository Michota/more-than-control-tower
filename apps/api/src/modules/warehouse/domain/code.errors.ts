import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class CodeNotFoundError extends NotFoundDomainException {
    public readonly code = "CODE.NOT_FOUND";

    constructor(id: string) {
        super(`Code with id ${id} not found`);
    }
}

export class CodeValueAlreadyExistsError extends ConflictDomainException {
    public readonly code = "CODE.VALUE_ALREADY_EXISTS";

    constructor(value: string) {
        super(`Code with value "${value}" already exists`);
    }
}
