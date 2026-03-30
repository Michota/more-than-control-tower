import { Primitive } from "type-fest";

// export const VALUE_OBJECT_VALUE_PROPERTY_KEY = "value" as const // this approach makes it cumbersome to use DomainPrimitive in generic way, so we will just use string literal instead of const assertion

export type DomainPrimitiveValue = Primitive | Date;

export interface DomainPrimitive<T extends DomainPrimitiveValue> {
    value: T;
}

export function isDomainPrimitiveAbstract<T>(obj: unknown): obj is DomainPrimitive<T & DomainPrimitiveValue> {
    return (
        typeof obj === "object" &&
        obj !== null &&
        Object.prototype.hasOwnProperty.call(obj, "value") &&
        Object.keys(obj).length === 1
    );
}
