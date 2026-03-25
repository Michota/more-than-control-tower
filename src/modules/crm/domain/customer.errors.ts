import { NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class CustomerNotFoundError extends NotFoundDomainException {
    public readonly code = "CUSTOMER.NOT_FOUND";

    constructor(customerId: string) {
        super(`Customer with id "${customerId}" not found`);
    }
}
