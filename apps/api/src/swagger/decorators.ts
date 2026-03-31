import { applyDecorators } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptions } from "@nestjs/swagger";

/**
 * Documents an enum property in Swagger with auto-generated description of all values.
 */
export const ApiEnum = (enumObj: object, options?: Omit<ApiPropertyOptions, "enum">) => {
    const description = Object.entries(enumObj)
        .filter(([key]) => isNaN(Number(key)))
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");

    return ApiProperty({
        ...(options as ApiPropertyOptions),
        enum: enumObj,
        description: `${description}${options?.description ? `. ${options.description}` : ""}`,
    } as ApiPropertyOptions);
};

/**
 * Automatically resolves the correct Swagger type for branded types
 * (e.g. `string & { __brand: '...' }`) which the Swagger plugin misreads as 'object'.
 */
export function ApiBrandedProperty(options: Omit<ApiPropertyOptions, "type"> = {}): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const type = Reflect.getMetadata("design:type", target, propertyKey) ?? Object;
        applyDecorators(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ApiProperty({ ...(options as ApiPropertyOptions), type } as ApiPropertyOptions),
        )(target, propertyKey);
    };
}
