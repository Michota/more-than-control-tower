import { ArgumentInvalidException } from '@libs/exceptions';
import { DisallowProperty } from '@libs/types';
import { has } from 'es-toolkit/compat';

type DisallowId<T> = DisallowProperty<T, 'id'>;

type CreateValueObjectProps<T> = DisallowId<T>;

export abstract class ValueObject<T> {
    constructor(props: CreateValueObjectProps<T>) {
        if (has(props, 'id')) {
            throw new ArgumentInvalidException(
                `Value Objects are not capable of using 'id'! Are you sure you wanted to use ValueObject and not Entity?`,
            );
        }
    }
}
