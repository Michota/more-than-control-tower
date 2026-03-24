import { ApiProperty } from "@nestjs/swagger";

export class GoodWeightResponseDto {
    /** @example 0.5 */
    value!: number;
    /** @example "kg" */
    unit!: string;
}

export class GoodDimensionsResponseDto {
    /** @example 30 */
    length!: number;
    /** @example 20 */
    width!: number;
    /** @example 15 */
    height!: number;
    /** @example "cm" */
    unit!: string;
}

export class GoodResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    id!: string;
    /** @example "Glass bottle" */
    name!: string;
    /** @example "Empty glass bottle, 500ml" */
    description?: string;

    @ApiProperty({ type: GoodWeightResponseDto })
    weight!: GoodWeightResponseDto;

    @ApiProperty({ type: GoodDimensionsResponseDto })
    dimensions!: GoodDimensionsResponseDto;

    /** @example "660e8400-e29b-41d4-a716-446655440000" */
    parentId?: string;
}

export class GoodIdResponseDto {
    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    goodId!: string;
}

export class PaginatedGoodsResponseDto {
    @ApiProperty({ type: [GoodResponseDto] })
    data!: GoodResponseDto[];
    /** @example 42 */
    count!: number;
    /** @example 1 */
    page!: number;
    /** @example 20 */
    limit!: number;
}
