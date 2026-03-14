import { ArgumentInvalidException } from "@libs/exceptions";
import { DisallowProperty } from "@libs/types";
import { has } from "es-toolkit/compat";
import { DomainPrimitive, DomainPrimitiveValue } from "./domain-primitive";

type DisallowId<T> = DisallowProperty<T, "id">;

type ValueObjectProps<T> = DisallowId<T>;

export abstract class ValueObject<T> {
    constructor(props: ValueObjectProps<T>) {
        if (has(props, "id")) {
            throw new ArgumentInvalidException(
                `Value Objects are not capable of using 'id'! Are you sure you wanted to use ValueObject and not Entity?`,
            );
        }
    }

    static isValueObject(obj: unknown): obj is ValueObject<unknown> {
        return obj instanceof ValueObject;
    }

    /**
     * Check if two Value Objects are equal. Checks structural equality.
     * @param vo ValueObject
     */
    public equals(vo?: ValueObject<T>): boolean {
        if (vo == null) {
            return false;
        }

        return JSON.stringify(this) === JSON.stringify(vo);
    }

    private isDomainPrimitive(obj: unknown): obj is DomainPrimitive<T & DomainPrimitiveValue> {
        if (Object.prototype.hasOwnProperty.call(obj, "value")) {
            return true;
        }
        return false;
    }
}
