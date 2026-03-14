// * No imports from libs/ddd/value-objects to avoid circular dependencies
// * No imports from libs/ddd/entities to avoid circular dependencies

import { ValueOf } from "type-fest";

function isValueObject(obj: unknown): obj is { unpack(): unknown } {
    return typeof (obj as Record<string, unknown>)?.unpack === "function";
}

function isEntity(obj: unknown): obj is { toObject(): unknown; id: unknown } {
    return typeof (obj as Record<string, unknown>)?.toObject === "function" && "id" in (obj as object);
}

function convertToPlainObject(item: unknown): unknown {
    if (isValueObject(item)) {
        return item.unpack();
    }
    if (isEntity(item)) {
        return item.toObject();
    }
    return item;
}

/**
 * Converts Entity/Value Objects props to a plain object.
 * Useful for testing and debugging.
 * @param properties
 */
export function convertPropertiesToObject<T extends object>(properties: T): Record<keyof T, ValueOf<T>> {
    const propertiesCopy = structuredClone(properties) as Record<string, unknown>;

    for (const property in propertiesCopy) {
        if (Array.isArray(propertiesCopy[property])) {
            propertiesCopy[property] = (propertiesCopy[property] as Array<unknown>).map((item) =>
                convertToPlainObject(item),
            );
        }
        propertiesCopy[property] = convertToPlainObject(propertiesCopy[property]);
    }

    return propertiesCopy as Record<keyof T, ValueOf<T>>;
}
