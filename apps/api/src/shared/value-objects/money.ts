import Decimal from "decimal.js";
import { ValueObject } from "../../libs/ddd/index.js";
import { Currency } from "./currency.js";

interface MoneyProperties {
    amount: Decimal;
    currency: Currency;
}

export class Money extends ValueObject<MoneyProperties> {
    static readonly ZERO = new Money(new Decimal(0), new Currency("PLN"));

    validate(props: MoneyProperties): void {
        if (props.amount.isNaN()) {
            throw new Error("Money amount cannot be NaN");
        } else if (!props.amount.isFinite()) {
            throw new Error("Money amount must be finite");
        } else if (props.amount.isNegative()) {
            throw new Error("Money amount cannot be negative");
        } else if (!Currency.isCurrency(props.currency)) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Invalid currency: ${props.currency}`);
        }
    }

    constructor(amount: Decimal, currency: Currency) {
        super({ amount, currency });
    }

    get amount(): Decimal {
        return this.properties.amount;
    }

    get currency(): Currency {
        return this.properties.currency;
    }

    isSameCurrency(other: Money): boolean {
        return this.currency.code === other.currency.code;
    }

    add(other: Money): Money {
        if (!this.isSameCurrency(other)) {
            throw new Error(`Currency mismatch: cannot add ${other.currency.code} to ${this.currency.code}`);
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    static sum(money: Money[]): Money {
        return money.reduce((acc, m) => acc.add(m), Money.ZERO);
    }

    subtract(other: Money): Money {
        if (!this.isSameCurrency(other)) {
            throw new Error(`Currency mismatch: cannot subtract ${other.currency.code} from ${this.currency.code}`);
        }
        return new Money(this.amount.sub(other.amount), this.currency);
    }
}
