import { NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

export class CustomerNotFoundError extends NotFoundDomainException {
    static readonly message = "error_customer_not_found";
    public readonly code = "CUSTOMER.NOT_FOUND";

    constructor(customerId: string) {
        super(CustomerNotFoundError.message, undefined, { customerId });
    }
}
