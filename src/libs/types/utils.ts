export type ObjectKey = string | number | symbol;

export type BrandedId<T, IdType = string> = T & { __brand: IdType };
