export type ObjectKey = string | number | symbol;

export type BrandedId<T extends string, IdType = string> = IdType & { __brand: T };
