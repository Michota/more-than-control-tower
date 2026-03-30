// Source: https://github.com/sindresorhus/type-fest/pull/4/

import { ConditionalExcept } from "type-fest";

/**
Create a new type from an object type extracting just properties, not methods.
@see JustMethods for extract just methods
Expand commentComment on line R91Resolved
@example
```
import {JustProperties} from 'type-fest';

interface Foo {
	a: string;
	b: number;
	c(): string;
	d(x: string): string;
}

const foo: JustProperties<Foo> = {a: 'a', b: 1};
```
*/
export type JustProperties<ObjectType> = ConditionalExcept<
    ObjectType,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    Function
>;

/**
Create a new type from an object type extracting just methods, not other properties.
@see JustProperties for extract just properties

@example
```
import {JustMethods} from 'type-fest';

interface Foo {
	a: string;
	b: number;
	c(): string;
	d(x: string): string;
}

const foo: JustMethods<Foo> = {c: () => 'c', d: (x: string) => x};
```
*/
export type JustMethods<ObjectType> = Pick<
    ObjectType,
    {
        [Method in keyof ObjectType]: ObjectType[Method] extends (...args: unknown[]) => unknown ? Method : never;
    }[keyof ObjectType]
>;
