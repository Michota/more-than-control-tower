import { Brand } from "ts-brand";

/*  UUID isn't used there because it can be generated outside of the entity,
    and this outside-generated ID can be of any type (string, number, etc.).
    The important part is that it's unique and immutable.
 */
export type EntityId<IdType = string> = Brand<IdType, "entity">;
