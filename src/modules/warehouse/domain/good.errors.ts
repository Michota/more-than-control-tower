import { Exception } from "../../../libs/exceptions/exception.abstract.js";

export class GoodNotFoundError extends Exception {
    public readonly code = "GOOD.NOT_FOUND";

    constructor(id: string) {
        super(`Good with id ${id} not found`);
    }
}

export class GoodNotInWarehouseError extends Exception {
    public readonly code = "GOOD.NOT_IN_WAREHOUSE";

    constructor() {
        super("Good is not located in any warehouse");
    }
}

export class IncorporatedGoodCannotBeManipulatedError extends Exception {
    public readonly code = "GOOD.INCORPORATED.CANNOT_BE_MANIPULATED";

    constructor() {
        super("Incorporated good cannot be transferred or removed directly while it has a parent");
    }
}
