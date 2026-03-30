import { randomUUID } from "crypto";
import { EntityId } from "../entities";

/**
 * Generates a random EntityId.
 * @param derivedId - Optional. If provided, it will be used as the EntityId instead of generating a new one.
 * @returns A random EntityId.
 */
export const generateEntityId = <T = string>(derivedId?: T) => (derivedId ?? randomUUID()) as unknown as EntityId<T>;
