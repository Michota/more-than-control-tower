import { Except } from "type-fest";
import { generateEntityId } from "../utils/randomize-entity-id.js";
import { EntityId } from "./entity-id.js";
import { isString } from "es-toolkit";
import { ArgumentInvalidException } from "../../exceptions/index.js";

interface BaseEntityProps {
    id: EntityId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface EntityProps<T> extends Except<BaseEntityProps, "id"> {
    id?: EntityId;
    properties: T;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateEntityProps<T> extends EntityProps<T> {}

export abstract class Entity<T> {
    declare private _id: EntityId;
    declare private _createdAt: Date;
    declare private _updatedAt: Date | undefined;
    declare private readonly _properties: T;

    constructor({ id, createdAt, updatedAt, properties }: CreateEntityProps<T>) {
        if (id !== undefined && !isString(id)) {
            throw new ArgumentInvalidException("Entity Id's needs to be stringified!");
        }
        Object.defineProperty(this, "_id", {
            value: id ?? generateEntityId(),
            writable: true,
            enumerable: false,
            configurable: true,
        });
        Object.defineProperty(this, "_createdAt", {
            value: createdAt || new Date(),
            writable: true,
            enumerable: false,
            configurable: true,
        });
        Object.defineProperty(this, "_updatedAt", {
            value: updatedAt,
            writable: true,
            enumerable: false,
            configurable: true,
        });
        Object.defineProperty(this, "_properties", {
            value: properties,
            writable: false,
            enumerable: false,
            configurable: false,
        });
    }

    get id(): EntityId {
        return this._id;
    }

    private set id(newId: EntityId) {
        if (!isString(newId)) {
            throw new ArgumentInvalidException("Id's needs to be stringified!");
        }
        this._id = newId;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date | undefined {
        return this._updatedAt;
    }

    private getMutableProperties(): EntityProps<T> {
        return Object.assign(
            {
                id: this.id,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
            },
            { properties: this._properties },
        );
    }

    /**
     * Returns entity properties.
     * @memberof Entity
     */
    protected getProperties(): EntityProps<T> {
        return Object.freeze(this.getMutableProperties());
    }
    /**
     * Properties of Entity.
     * @memberof Entity
     */
    get properties(): T {
        return this.getProperties().properties;
    }

    /**
     * Called automatically by JSON.stringify (and by NestJS when serializing HTTP responses).
     * Returns `{ id, ...properties }` — a shallow plain object where VO instances are still present,
     * but that is intentional: JSON.stringify will call each VO's own `toJSON()` recursively,
     * unpacking them to their raw values. Do not call this directly if you need a fully plain object;
     * use `toObject()` instead.
     *
     * Internal fields (`_id`, `_properties`, `_domainEvents`, etc.) are non-enumerable and never
     * appear in the output.
     */
    public toJSON(): { id: EntityId } & T {
        return Object.assign({ id: this.id }, this.properties);
    }

    /**
     * Returns a fully plain object with all levels unwrapped — no class instances anywhere.
     * Useful for tests and debugging (e.g. `expect(entity.toObject()).toEqual({ id: '...', name: 'John' })`).
     *
     * Drives the full `toJSON()` chain (Entity → VO) via JSON.parse/stringify, which is the
     * simplest correct approach: the old `convertPropertiesToObject` utility was broken because it
     * called `structuredClone` first, stripping VO prototype methods so `unpack()` was never called.
     */
    public toObject(): unknown {
        return JSON.parse(JSON.stringify(this));
    }

    static isEntity(entity: unknown): entity is Entity<unknown> {
        return entity instanceof Entity;
    }

    /**
     * Checks if two entities are the same Entity by comparing ID field.
     * @param object Entity
     */
    public equals(object?: Entity<T>): boolean {
        if (object === null || object === undefined) {
            return false;
        }

        if (this === object) {
            return true;
        }

        if (!Entity.isEntity(object)) {
            return false;
        }

        return this.id ? this.id === object.id : false;
    }

    /**
     * Validate the entity's invariants. Should throw an error if validation fails.
     */
    public abstract validate(): void;
}
