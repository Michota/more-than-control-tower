import { BrandedId } from "../types";
import { convertPropertiesToObject } from "./utils";

export type EntityId = BrandedId<"entityId", string>;

interface BaseEntityProps {
    id: EntityId;
    createdAt: Date;
    updatedAt?: Date;
}

export interface EntityProps<T> extends BaseEntityProps {
    properties: T;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateEntityProps<T> extends EntityProps<T> {}

export abstract class Entity<T> {
    private _id: EntityId;
    private _createdAt: Date;
    private _updatedAt?: Date;
    protected readonly properties: T;

    constructor({ id, createdAt, updatedAt, properties }: CreateEntityProps<T>) {
        this._id = id;
        this._createdAt = createdAt || new Date();
        this._updatedAt = updatedAt;
        this.properties = properties;
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
            { properties: this.properties },
        );
    }

    /**
     * Returns entity properties.
     * @memberof Entity
     */
    public getProperties(): EntityProps<T> {
        return Object.freeze(this.getMutableProperties());
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
