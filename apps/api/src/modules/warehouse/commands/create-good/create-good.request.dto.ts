import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from "class-validator";
import { DimensionUnit } from "../../domain/good-dimensions.value-object.js";
import { WeightUnit } from "../../domain/good-weight.value-object.js";

export class CreateGoodRequestDto {
    /** @example "Glass bottle" */
    @IsString()
    @IsNotEmpty()
    name!: string;

    /** @example "Empty glass bottle, 500ml" */
    @IsString()
    @IsOptional()
    description?: string;

    /** @example 0.5 */
    @IsNumber()
    @IsPositive()
    weightValue!: number;

    /** @example "kg" */
    @IsEnum(WeightUnit)
    weightUnit!: WeightUnit;

    /** @example 30 */
    @IsNumber()
    @IsPositive()
    dimensionLength!: number;

    /** @example 20 */
    @IsNumber()
    @IsPositive()
    dimensionWidth!: number;

    /** @example 15 */
    @IsNumber()
    @IsPositive()
    dimensionHeight!: number;

    /** @example "cm" */
    @IsEnum(DimensionUnit)
    dimensionUnit!: DimensionUnit;

    /** @example "550e8400-e29b-41d4-a716-446655440000" */
    @IsUUID()
    @IsOptional()
    parentId?: string;
}
