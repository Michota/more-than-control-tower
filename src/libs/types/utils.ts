export type ObjectKey = string | number | symbol;

export type BrandedId<T, IdType = string> = IdType & { __brand: T };
