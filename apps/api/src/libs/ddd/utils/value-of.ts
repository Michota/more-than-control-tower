import { ValueObject } from "../value-objects/index.js";

/**
 * Extracts the properties of a Value Object. If the Value Object is a Domain Primitive, it extracts the value instead.
 */

export type ValueOf<T extends ValueObject<any>> = T extends ValueObject<infer V> ? V : never;
