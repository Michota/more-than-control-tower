import { Except } from "type-fest";
import { convertPropertiesToObject } from "../utils";
import { generateEntityId } from "../utils/randomize-entity-id";
import { EntityId } from "./entity-id";

interface BaseEntityProps {
    id: EntityId;
    createdAt: Date;
    updatedAt?: Date;
}

export interface EntityProps<T> extends Except<BaseEntityProps, "id"> {
    id?: EntityId;
    properties: T;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateEntityProps<T> extends EntityProps<T> {}

export abstract class Entity<T> {
    private _id: EntityId;
    private _createdAt: Date;
    private _updatedAt?: Date;
    private readonly _properties: T;

    constructor({ id, createdAt, updatedAt, properties }: CreateEntityProps<T>) {
        this._id = id ?? generateEntityId();
        this._createdAt = createdAt || new Date();
        this._updatedAt = updatedAt;
        this._properties = properties;
    }

    get id(): EntityId {
        return this._id;
    }

    private set id(newId: EntityId) {
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

    public toObject(): unknown {
        return Object.freeze(convertPropertiesToObject(this.getMutableProperties()));
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
