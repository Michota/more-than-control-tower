import { ArgumentInvalidException, ArgumentNotProvidedException } from "@libs/exceptions";
import { DisallowProperty } from "@libs/types";
import { has, isEmpty } from "es-toolkit/compat";
import { DomainPrimitive, DomainPrimitiveValue, isDomainPrimitiveAbstract } from "./domain-primitive";

type DisallowId<T> = DisallowProperty<T, "id">;

type ValueObjectProperties<T> = DisallowId<T extends DomainPrimitiveValue ? DomainPrimitive<T> : T>;

export abstract class ValueObject<T> {
    protected readonly properties: ValueObjectProperties<T>;

    constructor(properties: ValueObjectProperties<T>) {
        if (this.isEmpty(properties)) {
            throw new ArgumentNotProvidedException("Property cannot be empty");
        } else if (has(properties, "id")) {
            throw new ArgumentInvalidException(
                `Value Objects are not capable of using 'id'! Are you sure you wanted to use ValueObject and not Entity?`,
            );
        }

        this.validate(properties);

        this.properties = properties;
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

    private isEmpty(props: ValueObjectProperties<T>): boolean {
        return isEmpty(props) || (this.isDomainPrimitive(props) && isEmpty(props.value));
    }

    private isDomainPrimitive(obj: unknown): obj is DomainPrimitive<T & DomainPrimitiveValue> {
        return isDomainPrimitiveAbstract<T>(obj);
    }

    /**
     * Throws error if the properties are invalid. Override this method to implement custom validation logic.
     */
    protected abstract validate(props: ValueObjectProperties<T>): void;

    /**
     * Get raw properties of an object.
     */
    public unpack(): T {
        if (this.isDomainPrimitive(this.properties)) {
            return this.properties.value;
        }

        return Object.freeze(this.properties) as T;
    }
}
