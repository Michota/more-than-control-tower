type EntityId<T> = string & { __brand: T };

export interface BaseEntityProps<T> {
    id: EntityId<T>;
    createdAt: Date;
    updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateEntityProps<T> extends BaseEntityProps<T> {}

export abstract class Entity<T> {
    private _id: EntityId<T>;
    private _createdAt: Date;
    private _updatedAt?: Date;

    constructor({ id, createdAt, updatedAt }: CreateEntityProps<T>) {
        this._id = id;
        this._createdAt = createdAt || new Date();
        this._updatedAt = updatedAt;
    }

    get id(): EntityId<T> {
        return this._id;
    }

    private set id(newId: EntityId<T>) {
        this._id = newId;
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date | undefined {
        return this._updatedAt;
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
