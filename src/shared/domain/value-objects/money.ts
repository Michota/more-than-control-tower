import Decimal from 'decimal.js';
import { Currency } from './currency.js';

export class Money {
    static readonly ZERO = new Money(new Decimal(0), new Currency('PLN'));

    constructor(
        readonly amount: Decimal,
        readonly currency: Currency,
    ) {}

    isSameCurrency(other: Money): boolean {
        return this.currency.code === other.currency.code;
    }

    add(other: Money): Money {
        if (!this.isSameCurrency(other)) {
            throw new Error(`Currency mismatch: cannot add ${other.currency.code} to ${this.currency.code}`);
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    subtract(other: Money): Money {
        if (!this.isSameCurrency(other)) {
            throw new Error(`Currency mismatch: cannot subtract ${other.currency.code} from ${this.currency.code}`);
        }
        return new Money(this.amount.sub(other.amount), this.currency);
    }
}
