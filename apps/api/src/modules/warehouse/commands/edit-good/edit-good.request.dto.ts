import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { DimensionUnit } from "../../domain/good-dimensions.value-object.js";
import { WeightUnit } from "../../domain/good-weight.value-object.js";

export class EditGoodRequestDto {
    /** @example "Glass bottle (updated)" */
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    /** @example "Updated description" */
    @IsString()
    @IsOptional()
    description?: string;

    /** @example 0.6 */
    @IsNumber()
    @IsPositive()
    @IsOptional()
    weightValue?: number;

    /** @example "kg" */
    @IsEnum(WeightUnit)
    @IsOptional()
    weightUnit?: WeightUnit;

    /** @example 35 */
    @IsNumber()
    @IsPositive()
    @IsOptional()
    dimensionLength?: number;

    /** @example 22 */
    @IsNumber()
    @IsPositive()
    @IsOptional()
    dimensionWidth?: number;

    /** @example 18 */
    @IsNumber()
    @IsPositive()
    @IsOptional()
    dimensionHeight?: number;

    /** @example "cm" */
    @IsEnum(DimensionUnit)
    @IsOptional()
    dimensionUnit?: DimensionUnit;
}
