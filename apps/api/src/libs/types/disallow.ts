import { ObjectKey } from "./utils.js";

/**
 * * @description Disallow types that extend D from T
 */
export type Disallow<D, T> = T extends D ? never : T;
export type DisallowProperty<T, P extends ObjectKey> = T extends Record<P, any> ? never : T;
