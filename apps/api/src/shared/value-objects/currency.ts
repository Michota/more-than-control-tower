import { ArgumentInvalidException } from "../../libs/exceptions/index.js";
import { ValueObject } from "../../libs/ddd/index.js";

export class Currency extends ValueObject<string> {
    protected validate(props: { value: string }): void {
        if (!Intl.supportedValuesOf("currency").includes(props.value)) {
            throw new ArgumentInvalidException(`Invalid ISO 4217 currency code: ${props.value}`);
        }
    }

    constructor(code: string) {
        super({ value: code });
    }

    get code(): string {
        return this.unpack();
    }

    static isCurrency(obj: unknown): obj is Currency {
        return obj instanceof Currency;
    }
}
