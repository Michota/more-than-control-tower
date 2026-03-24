import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";
import { DimensionUnit } from "../../domain/good-dimensions.value-object.js";
import { WeightUnit } from "../../domain/good-weight.value-object.js";

export class EditGoodRequestDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    weightValue?: number;

    @IsEnum(WeightUnit)
    @IsOptional()
    weightUnit?: WeightUnit;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    dimensionLength?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    dimensionWidth?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    dimensionHeight?: number;

    @IsEnum(DimensionUnit)
    @IsOptional()
    dimensionUnit?: DimensionUnit;
}
