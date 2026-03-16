import { randomUUID, UUID } from 'crypto';

export abstract class EntityId<T extends string> {
    declare private readonly _brand: T;

    generate(): UUID {
        return randomUUID();
    }

    constructor(readonly value: UUID = this.generate()) {}
}
