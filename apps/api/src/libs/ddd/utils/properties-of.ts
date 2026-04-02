import { Entity } from "../entities/index.js";

/**
 * Extracts the properties of an Entity.
 */
export type PropertiesOf<T extends Entity<any>> = T extends Entity<infer P> ? P : never;
